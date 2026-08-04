import { api } from '../api';

export const RECIPE_TYPES = {
  'raw-to-semi': {
    key: 'raw-to-semi',
    label: 'Raw → Semi-Finished',
    description: 'How much raw material is needed per semi-finished unit',
    listPath: '/admin/recipes',
    createPath: '/admin/recipes/raw-to-semi/create',
    editPath: (id) => `/admin/recipes/raw-to-semi/${id}/edit`,
    inputLabel: 'Raw Material',
    outputLabel: 'Semi-Finished Product (output)',
    quantityHelp: 'e.g. 2.5 = 2.5 units of raw material per 1 semi-finished unit',
    api: {
      list: () => api.getRawToSemiRecipes(),
      create: (body) => api.createRawToSemiRecipe(body),
      update: (id, body) => api.updateRawToSemiRecipe(id, body),
      delete: (id) => api.deleteRawToSemiRecipe(id),
    },
    getInputId: (r) => r.raw_material_id,
    getOutputId: (r) => r.semi_finished_product_id,
    getInputName: (r) => r.raw_material?.name,
    getOutputName: (r) => r.semi_finished_product?.name,
    buildBody: (inputId, outputId, qty) => ({
      raw_material_id: Number(inputId),
      semi_finished_product_id: Number(outputId),
      input_quantity_per_unit: Number(qty),
    }),
  },
  'semi-to-finished': {
    key: 'semi-to-finished',
    label: 'Semi-Finished → Finished',
    description: 'How much semi-finished product is needed per finished unit',
    listPath: '/admin/recipes',
    createPath: '/admin/recipes/semi-to-finished/create',
    editPath: (id) => `/admin/recipes/semi-to-finished/${id}/edit`,
    inputLabel: 'Semi-Finished Product',
    outputLabel: 'Finished Product (output)',
    quantityHelp: 'e.g. 3 = 3 semi-finished units per 1 finished unit',
    api: {
      list: () => api.getSemiToFinishedRecipes(),
      create: (body) => api.createSemiToFinishedRecipe(body),
      update: (id, body) => api.updateSemiToFinishedRecipe(id, body),
      delete: (id) => api.deleteSemiToFinishedRecipe(id),
    },
    getInputId: (r) => r.semi_finished_product_id,
    getOutputId: (r) => r.finished_product_id,
    getInputName: (r) => r.semi_finished_product?.name,
    getOutputName: (r) => r.finished_product?.name,
    buildBody: (inputId, outputId, qty) => ({
      semi_finished_product_id: Number(inputId),
      finished_product_id: Number(outputId),
      input_quantity_per_unit: Number(qty),
    }),
  },
};

export function getRecipeType(type) {
  return RECIPE_TYPES[type] || null;
}
