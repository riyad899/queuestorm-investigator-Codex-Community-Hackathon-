export interface LogoCreateDto {
  name: string;
  url: string;
}

export interface LogoUpdateDto {
  name?: string;
  url?: string;
}

export interface LogoResponse {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}
