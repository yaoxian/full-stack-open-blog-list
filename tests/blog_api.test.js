const { test, describe, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);

const Blog = require("../models/Blog");
const User = require("../models/User");

beforeEach(async () => {
  await Blog.deleteMany();

  const blogObjects = helper.blogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

test("blogs are returned as JSON", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("blogs' unique identifiers are named id", async () => {
  const response = await api.get("/api/blogs");
  const ids = response.body.map((r) => r.id);

  assert(ids.every((id) => id));
});

describe("deleting blog", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const password = "sekret";
    const username = "root";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });

    await user.save();

    const loginResponse = await api
      .post("/api/login")
      .send({ username, password });

    token = loginResponse.body.token;

    const newBlog = {
      title: "Initial Blog",
      author: "Initial Author",
      url: "initial-url.com",
      likes: 0,
    };

    const blogResponse = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog);

    initialBlogId = blogResponse.body.id;
  });

  test("a blog with valid id can be deleted", async () => {
    const blogsAtStart = await helper.blogsInDb();

    await api
      .delete(`/api/blogs/${initialBlogId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    assert.strictEqual(blogsAtStart.length, blogsAtEnd.length + 1);
  });

  test("user without valid token cannot delete a blog", async () => {
    const blogsAtStart = await helper.blogsInDb();

    await api.delete(`/api/blogs/${initialBlogId}`).expect(401);

    const blogsAtEnd = await helper.blogsInDb();

    assert.strictEqual(blogsAtStart.length, blogsAtEnd.length);
  });
});

describe("adding blog", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const password = "sekret";
    const username = "root";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });

    await user.save();

    const loginResponse = await api
      .post("/api/login")
      .send({ username, password });

    token = loginResponse.body.token;
  });

  test("a valid blog can be added", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "Fake-Url.com",
      likes: 100,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.blogs.length + 1);

    const content = blogsAtEnd.map((b) => b.title);
    assert(content.includes("Test Blog"));
  });

  test("a valid blog with default likes as 0", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "Fake-Url.com",
    };

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog);
    const newBlogLikes = response.body.likes;
    assert(newBlogLikes === 0);
  });

  test("blog without title or url is not added", async () => {
    const invalidBlog = {
      author: "Test Author",
      url: "Fake-Url.com",
      likes: 100,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(invalidBlog)
      .expect(400);
  });
});

test("a blog with valid id can be updated", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogsToUpdate = blogsAtStart[0];
  blogsToUpdate.likes = 777;

  await api
    .put(`/api/blogs/${blogsToUpdate.id}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

after(async () => {
  await mongoose.connection.close();
});
