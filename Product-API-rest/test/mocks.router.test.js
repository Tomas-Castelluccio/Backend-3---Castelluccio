const assert = require("node:assert/strict");
const test = require("node:test");
const bcrypt = require("bcrypt");
const { createMocksRouter } = require("../src/routes/mocks.router");

const invokeRoute = async (router, method, path, request = {}) => {
  const layer = router.stack.find(
    (entry) => entry.route?.path === path && entry.route.methods[method.toLowerCase()]
  );
  assert.ok(layer, `No existe la ruta ${method} ${path}`);

  const response = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await layer.route.stack[0].handle(
    { body: {}, query: {}, ...request },
    response,
    (error) => {
      if (error) throw error;
    }
  );
  return response;
};

test("GET /mockingusers devuelve 50 usuarios con el formato requerido", async () => {
  const router = createMocksRouter({
    usersRepository: { createMany: async (users) => users },
    petsRepository: { createMany: async (pets) => pets },
  });

  const response = await invokeRoute(router, "GET", "/mockingusers");
  const users = response.body;

  assert.equal(response.statusCode, 200);
  assert.equal(users.length, 50);
  for (const user of users) {
    assert.match(user._id, /^[a-f\d]{24}$/i);
    assert.equal(typeof user.first_name, "string");
    assert.equal(typeof user.last_name, "string");
    assert.match(user.email, /^user.+-\d+@example\.com$/);
    assert.equal(typeof user.age, "number");
    assert.ok(["user", "admin"].includes(user.role));
    assert.deepEqual(user.pets, []);
    assert.equal(user.__v, 0);
    assert.equal(await bcrypt.compare("coder123", user.password), true);
  }
});

test("POST /generateData persiste y devuelve las cantidades solicitadas", async () => {
  const persistedUsers = [];
  const persistedPets = [];
  const repositories = {
    usersRepository: {
      createMany: async (users) => {
        persistedUsers.push(...users);
        return users;
      },
    },
    petsRepository: {
      createMany: async (pets) => {
        persistedPets.push(...pets);
        return pets;
      },
    },
  };
  const router = createMocksRouter(repositories);
  const response = await invokeRoute(router, "POST", "/generateData", {
    body: { users: 3, pets: 2 },
  });
  const result = response.body;

  assert.equal(response.statusCode, 201);
  assert.deepEqual(result, {
    message: "Datos generados e insertados correctamente",
    users: 3,
    pets: 2,
  });

  // Volver a consultar los repositorios verifica que el endpoint los persistió.
  assert.equal(persistedUsers.length, 3);
  assert.equal(persistedPets.length, 2);
  for (const user of persistedUsers) {
    assert.ok(user.password.startsWith("$2"));
    assert.deepEqual(user.pets, []);
  }
  for (const pet of persistedPets) {
    assert.ok(["perro", "gato"].includes(pet.species));
    assert.equal(typeof pet.name, "string");
    assert.equal(typeof pet.breed, "string");
    assert.equal(typeof pet.age, "number");
    assert.equal(pet.adopted, false);
  }
});
