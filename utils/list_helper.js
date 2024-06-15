const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const reducer = (accumulator, blog) => {
    return accumulator + blog.likes;
  };
  return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  let mostLiked = blogs[0];

  blogs.forEach((blog) => {
    if (blog.likes > mostLiked.likes) {
      mostLiked = blog;
    }
  });

  return mostLiked;
};

const mostBlogs = (blogs) => {
  let blogsCount = new Map();
  let maxAuthor = null;
  let maxBlogs = -Infinity;

  blogs.forEach((blog) => {
    let counts = null;
    if (blogsCount.has(blog.author)) {
      counts = blogsCount.get(blog.author) + 1;
      blogsCount.set(blog.author, counts);
    } else {
      counts = 1;
      blogsCount.set(blog.author, 1);
    }

    if (counts > maxBlogs) {
      maxAuthor = blog.author;
      maxBlogs = counts;
    }
  });

  return {
    author: maxAuthor,
    blogs: maxBlogs,
  };
};

const mostLikes = (blogs) => {
  let likesCount = new Map();
  let maxAuthor = null;
  let maxLikes = -Infinity;

  blogs.forEach((blog) => {
    let counts = null;
    if (likesCount.has(blog.author)) {
      counts = likesCount.get(blog.author) + blog.likes;
      likesCount.set(blog.author, counts);
    } else {
      counts = blog.likes;
      likesCount.set(blog.author, counts);
    }

    if (counts > maxLikes) {
      maxAuthor = blog.author;
      maxLikes = counts;
    }
  });

  return {
    author: maxAuthor,
    likes: maxLikes,
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
