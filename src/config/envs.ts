import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  PRODUCT_MS_PORT: string;
  PRODUCT_MS_HOST: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    PRODUCT_MS_PORT: joi.string().required(),
    PRODUCT_MS_HOST: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
}) as { error?: joi.ValidationError; value: EnvVars };

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  productMicroservice: {
    host: envVars.PRODUCT_MS_HOST,
    port: parseInt(envVars.PRODUCT_MS_PORT, 10),
  },
};
