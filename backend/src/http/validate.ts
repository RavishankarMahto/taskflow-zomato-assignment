import Joi from "joi";
import { validationError } from "./errors.js";

export function validate<T>(schema: Joi.ObjectSchema<T>, input: unknown): T {
  const { error, value } = schema.validate(input, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
  });
  if (!error) return value as T;

  const fields: Record<string, string> = {};
  for (const d of error.details) {
    const key = d.path.join(".") || "body";
    fields[key] = d.message.replaceAll('"', "");
  }
  throw validationError(fields);
}

