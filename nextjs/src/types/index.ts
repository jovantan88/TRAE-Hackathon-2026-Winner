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

export interface Friend {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  try_on_id: string;
  caption: string | null;
  created_at: string;
  user?: Profile;
  try_on?: TryOnResult;
  likes?: PostLike[];
  items?: WardrobeItem[];
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface TryOnResultWithItems extends TryOnResult {
  try_on_items: (TryOnItem & { wardrobe_item: WardrobeItem })[];
  is_favorited?: boolean;
}
