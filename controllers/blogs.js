const blogsRouter = require("express").Router();
const Blog = require("../models/Blog");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const blog = new Blog(request.body);

  if (blog.likes === undefined) {
    blog.likes = 0;
  }

  if (blog.url === undefined || blog.title === undefined) {
    response.status(400).end();
  }

  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

module.exports = blogsRouter;
