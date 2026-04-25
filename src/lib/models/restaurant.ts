import { z } from "zod";

export const RestaurantStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const PriceRangeSchema       = z.enum(["low", "mid", "high"]);

export const RestaurantSchema = z.object({
  id:              z.string().uuid(),
  name_ja:         z.string().nullable(),
  name_ko:         z.string().nullable(),
  address_ja:      z.string().nullable(),
  address_ko:      z.string().nullable(),
  latitude:        z.number().nullable(),
  longitude:       z.number().nullable(),
  price_range:     PriceRangeSchema.nullable(),
  status:          RestaurantStatusSchema,
  is_solo_default: z.boolean(),
  has_jp_menu:     z.boolean(),
  is_late_night:   z.boolean(),
  naver_url:       z.string().nullable(),
  photo_url:       z.string().nullable(),
  created_at:      z.string(),
  updated_at:      z.string(),
});

export type Restaurant       = z.infer<typeof RestaurantSchema>;
export type RestaurantStatus = z.infer<typeof RestaurantStatusSchema>;
export type PriceRange       = z.infer<typeof PriceRangeSchema>;
