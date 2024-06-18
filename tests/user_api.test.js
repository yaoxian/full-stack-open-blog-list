const { test, after, beforeEach, describe } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const bcrypt = require("bcrypt");
const helper = require("./test_helper");
const User = require("../models/User");

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "test",
      name: "test-user",
      password: "fake-password",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const userAtEnd = await helper.usersInDb();
    assert.strictEqual(userAtStart.length + 1, userAtEnd.length);
  });

  test("creation fails with a repeated username", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "test-user",
      password: "fake-password",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const userAtEnd = await helper.usersInDb();
    assert.strictEqual(userAtStart.length, userAtEnd.length);
  });

  test("creation fails with a password shorter than 3 characters", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "test",
      name: "test-user",
      password: "12",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const userAtEnd = await helper.usersInDb();
    assert.strictEqual(userAtStart.length, userAtEnd.length);
  });
});

after(async () => {
  await mongoose.connection.close();
});
