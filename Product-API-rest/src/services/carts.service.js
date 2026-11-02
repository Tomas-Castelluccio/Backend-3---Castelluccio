const { AppError } = require("../errors/app-error");

const round2 = (value) => Math.round(value * 100) / 100;

class CartsService {
  constructor(cartsRepository, productsRepository, ordersRepository) {
    this.cartsRepository = cartsRepository;
    this.productsRepository = productsRepository;
    this.ordersRepository = ordersRepository;
  }

  async getCarts(user) {
    if (user.role === "admin") return this.cartsRepository.findAll();
    return this.cartsRepository.findByOwner(user.id);
  }

  async getAllCarts() {
    return this.cartsRepository.findAll();
  }

  async getCartById(id) {
    if (!id) throw new Error("ID requerido");
    return this.cartsRepository.findById(id);
  }

  async createCart(user) {
    return this.cartsRepository.create(user ? user.id : undefined);
  }

  async addProduct(cid, pid) {
    if (!cid) throw new Error("ID de carrito requerido");
    if (!pid) throw new Error("ID de producto requerido");

    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const product = await this.productsRepository.findById(pid);
    if (!product) throw new Error("Producto no encontrado");

    if (product.status === false) {
      throw new AppError(`El producto "${product.title}" no está disponible`, 409);
    }

    const line = cart.products.find((item) => item.product === pid);
    const requested = line ? line.quantity + 1 : 1;

    if (Number.isFinite(Number(product.stock)) && Number(product.stock) < requested) {
      throw AppError.conflict(
        `Stock insuficiente de "${product.title}": quedan ${product.stock} unidades`
      );
    }

    return this.cartsRepository.addProduct(cid, pid);
  }

  async deleteProduct(cid, pid) {
    if (!cid) throw new Error("ID de carrito requerido");
    if (!pid) throw new Error("ID de producto requerido");

    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    return this.cartsRepository.deleteProduct(cid, pid);
  }

  async updateCart(cid, products) {
    if (!cid) throw new Error("ID de carrito requerido");
    if (!Array.isArray(products)) throw new Error("Products debe ser un array");

    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    for (const item of products) {
      if (!item.product || typeof item.quantity !== "number") {
        throw new Error("Cada item debe tener product (string) y quantity (number)");
      }
      const product = await this.productsRepository.findById(item.product);
      if (!product) throw new Error(`Producto ${item.product} no encontrado`);
    }

    return this.cartsRepository.updateCart(cid, products);
  }

  async updateProductQuantity(cid, pid, quantity) {
    if (!cid) throw new Error("ID de carrito requerido");
    if (!pid) throw new Error("ID de producto requerido");
    if (typeof quantity !== "number") throw new Error("Quantity debe ser un número");

    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const product = await this.productsRepository.findById(pid);
    if (!product) throw new Error("Producto no encontrado");

    if (quantity > 0) {
      const stock = Number(product.stock);
      if (Number.isFinite(stock) && stock < quantity) {
        throw AppError.conflict(
          `Stock insuficiente de "${product.title}": quedan ${stock} unidades`
        );
      }
    }

    return this.cartsRepository.updateProductQuantity(cid, pid, quantity);
  }

  async clearCart(cid) {
    if (!cid) throw new Error("ID de carrito requerido");

    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    return this.cartsRepository.clearCart(cid);
  }

  async deleteCart(id) {
    if (!id) throw new Error("ID requerido");
    const cart = await this.cartsRepository.findById(id);
    if (!cart) throw new Error("Carrito no encontrado");
    return this.cartsRepository.delete(id);
  }

  async purchaseCart(cid, user) {
    const cart = await this.cartsRepository.findById(cid);
    if (!cart) throw AppError.notFound("Carrito no encontrado");

    if (!cart.products || cart.products.length === 0) {
      throw AppError.badRequest("El carrito está vacío, no hay nada para comprar");
    }

    const items = [];
    const notPurchased = [];
    let total = 0;

    for (const line of cart.products) {
      const product = await this.productsRepository.findById(line.product);
      if (!product) {
        notPurchased.push({
          product: line.product,
          quantity: line.quantity,
          reason: "El producto ya no existe",
        });
        continue;
      }

      if (product.status === false) {
        notPurchased.push({
          product: line.product,
          quantity: line.quantity,
          reason: "El producto no está disponible para la venta",
        });
        continue;
      }

      const quantity = Number(line.quantity);
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw AppError.badRequest(
          `Cantidad inválida para "${product.title}"`
        );
      }

      const stock = Number(product.stock);
      if (!Number.isFinite(stock)) {
        notPurchased.push({
          product: line.product,
          quantity,
          reason: "El producto no tiene stock cargado",
        });
        continue;
      }

      if (stock < quantity) {
        notPurchased.push({
          product: line.product,
          quantity,
          reason: `Stock insuficiente: quedan ${stock} unidades`,
        });
        continue;
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) {
        throw AppError.conflict(`El producto "${product.title}" tiene un precio inválido`);
      }
      const subtotal = round2(price * quantity);

      items.push({
        product: product.id,
        title: product.title,
        price,
        quantity,
        subtotal,
      });

      total += subtotal;
    }

    const buyerId = cart.owner || (user ? user.id : undefined);
    if (!buyerId) {
      throw AppError.badRequest("El carrito no tiene un dueño asignado");
    }

    for (const item of items) {
      await this.productsRepository.decrementStock(item.product, item.quantity);
    }

    let ticket = null;
    if (items.length > 0) {
      ticket = await this.ordersRepository.create({
        user: buyerId,
        purchaser: user && user.email ? user.email : String(buyerId),
        cart: cart.id,
        items,
        total: round2(total),
        amount: round2(total),
        purchase_datetime: new Date(),
        status: "paid",
      });
    }

    const remainingCart = await this.cartsRepository.updateCart(
      cart.id,
      notPurchased.map(({ product, quantity }) => ({ product, quantity }))
    );

    if (!ticket) {
      return { ticket: null, notPurchased, cart: remainingCart };
    }

    return { ...ticket, notPurchased, cart: remainingCart };
  }
}

module.exports = CartsService;
