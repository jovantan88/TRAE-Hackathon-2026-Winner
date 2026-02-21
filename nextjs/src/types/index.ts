export type ClothingCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "accessories"
  | "activewear"
  | "other";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserModel {
  id: string;
  user_id: string;
  original_photo_url: string;
  model_image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  category: ClothingCategory;
  original_image_url: string;
  segmented_image_url: string | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TryOnResult {
  id: string;
  user_id: string;
  model_id: string;
  result_image_url: string;
  prompt_used: string | null;
  created_at: string;
}

export interface TryOnItem {
  id: string;
  try_on_id: string;
  wardrobe_item_id: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  try_on_id: string;
  notes: string | null;
  created_at: string;
}

export interface TryOnResultWithItems extends TryOnResult {
  try_on_items: (TryOnItem & { wardrobe_item: WardrobeItem })[];
  is_favorited?: boolean;
}
