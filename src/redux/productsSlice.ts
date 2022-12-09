import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { TProduct, TProductState } from '../types';
import { fetchSize, getPageProducts } from '../api/api';

const initialState: TProductState = {
   isLoading: false,
   isError: false,
   products: [],
   pages: 1
};

const getSize = createAsyncThunk(
   'products/getSize',
   async ({ category, itemCount }: { category: string; itemCount: number }): Promise<number> => {
      const pages: number = await fetchSize(category as string);
      return pages / itemCount;
   }
);

const fetchPageProducts = createAsyncThunk(
   'products/fetchPageProducts',
   async ({
      category,
      currentPage,
      itemCount
   }: {
      category: string;
      currentPage: number;
      itemCount: number;
   }) => {
      const result: TProduct[] = [];
      const data = await getPageProducts(category, currentPage, itemCount);

      data.forEach((doc) => {
         const [id, { name, count, gender, imgUrl, price, views, brand, quantity }] = [
            doc.id,
            doc.data()
         ];
         result.push({
            id,
            name,
            count,
            gender,
            imgUrl,
            category,
            price,
            views,
            brand,
            quantity
         });
      });
      if (!result.length) {
         throw new Error('Something went wrong');
      }
      return result;
   }
);

const productsSlice = createSlice({
   name: 'products',
   initialState,
   reducers: {},
   extraReducers: (builder) => {
      builder
         .addCase(fetchPageProducts.fulfilled, (state, action) => {
            state.isLoading = false;
            state.products = action.payload;
         })
         .addCase(fetchPageProducts.pending, (state) => {
            state.isError = false;
            state.isLoading = true;
         })
         .addCase(fetchPageProducts.rejected, (state) => {
            state.products = [];
            state.isLoading = false;
            state.isError = true;
         })
         .addCase(getSize.fulfilled, (state, action) => {
            state.pages = Math.ceil(action.payload);
         });
   }
});

export { fetchPageProducts, getSize };
export default productsSlice.reducer;
