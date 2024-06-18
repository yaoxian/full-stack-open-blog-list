const blogsRouter = require("express").Router();
const Blog = require("../models/Blog");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const middleware = require("../utils/middleware");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken) {
    return response.status(401).json({ error: "token invalid" });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog(request.body);
  blog.user = user.id;

  if (blog.likes === undefined) {
    blog.likes = 0;
  }

  if (blog.url === undefined || blog.title === undefined) {
    response.status(400).end();
  }

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogsRouter.delete(
  "/:id",
  middleware.userExtractor,
  async (request, response) => {
    const blogId = request.params.id;
    const blog = await Blog.findById(blogId);

    if (blog.user.toString() === request.userId) {
      await Blog.findByIdAndDelete(blogId);
      response.status(204).end();
    } else {
      return response.status(401).json({ error: "Not authorised" });
    }
  }
);

blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const newBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(newBlog);
});

module.exports = blogsRouter;
