# Orders MicroService

```bash
docker compose up -d
```

## Development pasos

- Clonar el proyecto
- Crear un archivo `.env` basado en el archivo `.env.template`
- Levantar la base de datos con `docker compose up -d`
- Levantar el servidor de NATS:

  ```bash
    docker run -d --name nats-main -p 4222:4222 -p 6222:6222 -p 8222:8222 nats
  ```

- Levantar el proyecto con `npm run start:dev`
