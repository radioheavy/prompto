// fal.ai API Client
// Supports: Model discovery, Image generation

export interface FalModel {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface FalGenerateRequest {
  apiKey: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
  numImages?: number;
  seed?: number;
}

export interface FalGenerateResponse {
  success: boolean;
  images?: { url: string; content_type: string }[];
  error?: string;
  seed?: number;
}

// Popular fal.ai image generation models (curated list)
export const FAL_POPULAR_MODELS: FalModel[] = [
  { id: 'fal-ai/flux-2-pro', name: 'FLUX 2 Pro', description: 'En son FLUX modeli, maksimum kalite' },
  { id: 'fal-ai/nano-banana-pro', name: 'Nano Banana Pro', description: 'Hizli ve kaliteli gorsel uretimi' },
  { id: 'fal-ai/fast-sdxl', name: 'Fast SDXL', description: 'Hizli Stable Diffusion XL' },
  { id: 'fal-ai/fast-lightning-sdxl', name: 'Lightning SDXL', description: 'Ultra hizli SDXL' },
  { id: 'fal-ai/hyper-sdxl', name: 'Hyper SDXL', description: 'Gelistirilmis SDXL' },
];

// Image size options
export const FAL_IMAGE_SIZES = [
  { value: 'square_hd', label: '1024x1024 (Square HD)' },
  { value: 'square', label: '512x512 (Square)' },
  { value: 'portrait_4_3', label: '768x1024 (Portrait 4:3)' },
  { value: 'portrait_16_9', label: '576x1024 (Portrait 16:9)' },
  { value: 'landscape_4_3', label: '1024x768 (Landscape 4:3)' },
  { value: 'landscape_16_9', label: '1024x576 (Landscape 16:9)' },
];

// Fetch models from fal.ai API (with fallback to curated list)
export async function fetchFalModels(): Promise<FalModel[]> {
  try {
    const allModels: FalModel[] = [];
    let page = 1;
    const maxPages = 5; // Safety limit

    while (page <= maxPages) {
      const response = await fetch(
        `https://fal.ai/api/models?categories=text-to-image&page=${page}&size=50`
      );

      if (!response.ok) break;

      const data = await response.json();
      if (!data.items || data.items.length === 0) break;

      for (const item of data.items) {
        if (item.modelId && item.title) {
          allModels.push({
            id: item.modelId,
            name: item.title,
            description: item.shortDescription || undefined,
          });
        }
      }

      if (page >= (data.pages || 1)) break;
      page++;
    }

    return allModels.length > 0 ? allModels : FAL_POPULAR_MODELS;
  } catch {
    // Fallback to curated list on error
    return FAL_POPULAR_MODELS;
  }
}

// Generate image using fal.ai
export async function generateImage(request: FalGenerateRequest): Promise<FalGenerateResponse> {
  try {
    const response = await fetch(`https://fal.run/${request.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${request.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        image_size: request.imageSize || 'square_hd',
        num_images: request.numImages || 1,
        seed: request.seed,
        sync_mode: true, // Wait for result
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return {
        success: false,
        error: error.detail || error.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.images && Array.isArray(data.images)) {
      return {
        success: true,
        images: data.images,
        seed: data.seed,
      };
    }

    // Some models return image directly
    if (data.image) {
      return {
        success: true,
        images: [data.image],
        seed: data.seed,
      };
    }

    return {
      success: false,
      error: 'No images in response',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
