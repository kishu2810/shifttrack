export type User = {
  id: string;
  name: string;
};

export type Session = {
  token: string;
  user: User;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
