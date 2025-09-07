import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  product?: Product;
}

const initialState: ModalState = {
  isOpen: false,
  mode: 'create',
  product: undefined,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openCreateModal: (state) => {
      state.isOpen = true;
      state.mode = 'create';
      state.product = undefined;
    },
    
    openEditModal: (state, action: PayloadAction<Product>) => {
      state.isOpen = true;
      state.mode = 'edit';
      state.product = action.payload;
    },
    
    closeModal: (state) => {
      state.isOpen = false;
      state.mode = 'create';
      state.product = undefined;
    },
  },
});

export const { openCreateModal, openEditModal, closeModal } = modalSlice.actions;

export default modalSlice.reducer;
