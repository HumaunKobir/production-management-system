import { api } from '../api';

export const PRODUCT_TYPES = {
  raw: {
    key: 'raw',
    label: 'Raw Material',
    plural: 'Raw Materials',
    listPath: '/admin/products',
    createPath: '/admin/products/raw/create',
    editPath: (id) => `/admin/products/raw/${id}/edit`,
    api: {
      list: () => api.getRawMaterials(),
      create: (body) => api.createRawMaterial(body),
      update: (id, body) => api.updateRawMaterial(id, body),
      delete: (id) => api.deleteRawMaterial(id),
    },
  },
  semi: {
    key: 'semi',
    label: 'Semi-Finished',
    plural: 'Semi-Finished Products',
    listPath: '/admin/products',
    createPath: '/admin/products/semi/create',
    editPath: (id) => `/admin/products/semi/${id}/edit`,
    api: {
      list: () => api.getSemiFinished(),
      create: (body) => api.createSemiFinished(body),
      update: (id, body) => api.updateSemiFinished(id, body),
      delete: (id) => api.deleteSemiFinished(id),
    },
  },
  finished: {
    key: 'finished',
    label: 'Finished Product',
    plural: 'Finished Products',
    listPath: '/admin/products',
    createPath: '/admin/products/finished/create',
    editPath: (id) => `/admin/products/finished/${id}/edit`,
    api: {
      list: () => api.getFinished(),
      create: (body) => api.createFinished(body),
      update: (id, body) => api.updateFinished(id, body),
      delete: (id) => api.deleteFinished(id),
    },
  },
};

export function getProductType(type) {
  return PRODUCT_TYPES[type] || null;
}
