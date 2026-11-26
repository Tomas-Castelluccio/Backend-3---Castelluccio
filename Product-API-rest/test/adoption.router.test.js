const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const { createAdoptionRouter } = require("../src/routes/adoption.router");
const AdoptionsController = require("../src/controllers/adoptions.controller");
const AdoptionsService = require("../src/services/adoptions.service");

const createFixture = () => {
  const users = new Map([["user-1", { id: "user-1", pets: [] }]]);
  const pets = new Map([["pet-1", { id: "pet-1", name: "Mora", adopted: false }]]);
  const adoptions = [];

  const usersRepository = {
    findById: async (id) => users.get(id) || null,
    addPet: async (userId, petId) => {
      users.get(userId).pets.push(petId);
      return users.get(userId);
    },
  };
  const petsRepository = {
    findById: async (id) => pets.get(id) || null,
    markAdopted: async (id) => {
      pets.get(id).adopted = true;
      return pets.get(id);
    },
  };
  const adoptionsRepository = {
    findAll: async () => [...adoptions],
    findById: async (id) => adoptions.find((item) => item.id === id) || null,
    create: async (owner, pet) => {
      const adoption = { id: `adoption-${adoptions.length + 1}`, owner, pet };
      adoptions.push(adoption);
      return adoption;
    },
  };

  const service = new AdoptionsService(adoptionsRepository, usersRepository, petsRepository);
  const router = createAdoptionRouter(new AdoptionsController(service));
  return { router, users, pets, adoptions };
};

// Ejecuta el router Express real; los repositorios en memoria mantienen las pruebas independientes de Mongo.
const dispatchRequest = (router, method, path) =>
  new Promise((resolve, reject) => {
    const app = express();
    const req = Object.assign(Object.create(express.request), {
      app,
      baseUrl: "",
      originalUrl: path,
      url: path,
      method,
      headers: {},
      body: {},
      params: {},
    });
    Object.defineProperty(req, "query", { value: {}, writable: true });
    const res = Object.assign(Object.create(express.response), {
      app,
      req,
      locals: {},
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ statusCode: this.statusCode, body });
        return this;
      },
    });
    req.res = res;

    router.handle(req, res, (error) => {
      if (error) {
        return resolve({
          statusCode: error.statusCode || 500,
          body: { success: false, message: error.message },
        });
      }
      reject(new Error(`No route matched ${method} ${path}`));
    });
  });

test("GET / lista las adopciones existentes", async () => {
  const { router, adoptions } = createFixture();
  adoptions.push({ id: "adoption-1", owner: "user-1", pet: "pet-1" });

  const response = await dispatchRequest(router, "GET", "/");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, adoptions);
});

test("GET /:aid devuelve la adopción encontrada", async () => {
  const { router, adoptions } = createFixture();
  const adoption = { id: "adoption-1", owner: "user-1", pet: "pet-1" };
  adoptions.push(adoption);

  const response = await dispatchRequest(router, "GET", "/adoption-1");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, adoption);
});

test("GET /:aid responde 404 si la adopción no existe", async () => {
  const { router } = createFixture();

  const response = await dispatchRequest(router, "GET", "/unknown");
  assert.equal(response.statusCode, 404);
  assert.match(response.body.message, /Adopción no encontrada/);
});

test("POST /:uid/:pid crea la adopción y actualiza usuario y mascota", async () => {
  const { router, users, pets, adoptions } = createFixture();

  const response = await dispatchRequest(router, "POST", "/user-1/pet-1");
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    status: "success",
    adoption: { id: "adoption-1", owner: "user-1", pet: "pet-1" },
  });
  assert.equal(adoptions.length, 1);
  assert.equal(pets.get("pet-1").adopted, true);
  assert.deepEqual(users.get("user-1").pets, ["pet-1"]);
});

test("POST /:uid/:pid rechaza mascotas ya adoptadas", async () => {
  const { router, pets } = createFixture();
  pets.get("pet-1").adopted = true;

  const response = await dispatchRequest(router, "POST", "/user-1/pet-1");
  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /ya fue adoptada/);
});

test("POST /:uid/:pid responde 404 cuando el usuario no existe", async () => {
  const { router } = createFixture();

  const response = await dispatchRequest(router, "POST", "/unknown/pet-1");
  assert.equal(response.statusCode, 404);
  assert.match(response.body.message, /Usuario no encontrado/);
});

test("POST /:uid/:pid responde 404 cuando la mascota no existe", async () => {
  const { router } = createFixture();

  const response = await dispatchRequest(router, "POST", "/user-1/unknown");
  assert.equal(response.statusCode, 404);
  assert.match(response.body.message, /Mascota no encontrada/);
});
