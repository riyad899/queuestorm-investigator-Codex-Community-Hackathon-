export interface ICreateBlogCategoryPayload {
  name: string;
}

export interface ICreateAuthorPayload {
  name: string;
  avatar?: string;
}

export interface ICreateBlogPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail?: string;
  categoryId: string;
  authorId: string;
  readTime: number;
  tags: string[];
}

export interface IUpdateBlogPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  thumbnail?: string;
  categoryId?: string;
  authorId?: string;
  readTime?: number;
  tags?: string[];
}

export interface IBlogResponse {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail?: string;
  readTime: number;
  publishedAt: Date;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}
