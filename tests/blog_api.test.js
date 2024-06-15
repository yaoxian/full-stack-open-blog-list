const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const mongoose = require("mongoose");

const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);

const Blog = require("../models/Blog");
const { appendFile } = require("node:fs");

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

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "Test Blog",
    author: "Test Author",
    url: "Fake-Url.com",
    likes: 100,
  };

  await api
    .post("/api/blogs")
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

  const response = await api.post("/api/blogs").send(newBlog);
  const newBlogLikes = response.body.likes;
  assert(newBlogLikes === 0);
});

test("blog without title or url is not added", async () => {
  const invalidBlog = {
    author: "Test Author",
    url: "Fake-Url.com",
    likes: 100,
  };

  await api.post("/api/blogs").send(invalidBlog).expect(400);
});

after(async () => {
  await mongoose.connection.close();
});
