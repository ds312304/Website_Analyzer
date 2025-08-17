create extension if not exists "uuid-ossp";

create table if not exists websites (
    id uuid default uuid_generate_v4() primary key,
    url text not null unique,
    brand text,
    description text,
    keywords text[],
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);