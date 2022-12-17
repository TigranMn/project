import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
//Firebase
import {
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   UserCredential
} from 'firebase/auth';
import {
   addDoc,
   collection,
   DocumentData,
   getDocs,
   Query,
   query,
   QuerySnapshot,
   setDoc,
   where
} from 'firebase/firestore';
import { auth, db } from '../firebase';
//Utils
import { getUser } from '../api/api';
//Types
import { AccStatus, TBasketType, TLikedType, TUser } from '../types';

type TState = {
   email: string | null;
   id: string | null;
   token: string | null;
   name: string | null;
   lastName: string | null;
   isLoading: boolean;
   isError: boolean;
   isLogged: boolean;
   basket: TBasketType[];
   likedProducts: TLikedType[];
   status: string;
};

const initialState: TState = {
   email: null,
   id: null,
   token: null,
   name: null,
   lastName: null,
   isError: false,
   isLogged: false,
   isLoading: false,
   basket: [],
   likedProducts: [],
   status: AccStatus.GUEST
};

export const signIn = createAsyncThunk(
   'user/signIn',
   async ({ email, password }: { email: string; password: string }) => {
      const { user }: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const q: Query<DocumentData> = query(collection(db, 'users'), where('id', '==', user.uid));
      const resp: QuerySnapshot<DocumentData> = await getDocs(q);
      const data = resp.docs[0].data();
      return { data, user };
   }
);

export const signUp = createAsyncThunk(
   'user/signUp',
   async ({
      email,
      password,
      firstName,
      lastName
   }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
   }) => {
      const { user }: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      addDoc(collection(db, 'users'), {
         name: firstName,
         lastName,
         email: user.email,
         id: user.uid,
         likedProducts: [],
         basket: [],
         status: AccStatus.USER
      });
      return { user, firstName, lastName };
   }
);

export const likeProduct = createAsyncThunk(
   'basket/likeProduct',
   async ({
      productId,
      userId,
      category
   }: {
      productId: string;
      userId: string;
      category: string;
   }) => {
      const { userRef, snaps } = await getUser(userId);
      setDoc(
         userRef,
         { likedProducts: [...[...snaps.docs[0].data().likedProducts, { productId, category }]] },
         { merge: true }
      );
      return { productId, category };
   }
);

export const dislikeProduct = createAsyncThunk(
   'basket/dislikeProduct',
   async ({ productId, userId }: { productId: string; userId: string }) => {
      const { userRef, snaps } = await getUser(userId);
      setDoc(
         userRef,
         {
            likedProducts: [
               ...[
                  ...snaps.docs[0]
                     .data()
                     .likedProducts.filter(
                        (el: { category: string; productId: string }) => el.productId !== productId
                     )
               ]
            ]
         },
         { merge: true }
      );
      return productId;
   }
);

export const removeProduct = createAsyncThunk(
   'basket/removeProduct',
   async ({ productId, userId }: { productId: string; userId: string }) => {
      const { userRef, snaps } = await getUser(userId);

      setDoc(
         userRef,
         {
            basket: [...[...snaps.docs[0].data().basket].filter((el) => el.productId !== productId)]
         },
         { merge: true }
      );
      return productId;
   }
);

export const addProduct = createAsyncThunk(
   'basket/addProduct',
   async ({
      productId,
      userId,
      category,
      count
   }: {
      productId: string;
      userId: string;
      category: string;
      count: number;
   }) => {
      const { userRef, snaps } = await getUser(userId);

      const prod = [...snaps.docs[0].data().basket].find((el) => {
         return el.productId === productId;
      });
      if (prod) {
         setDoc(
            userRef,
            {
               basket: [
                  ...[...snaps.docs[0].data().basket].filter((el) => el.productId !== productId),
                  { ...prod, count: prod.count + count }
               ]
            },
            { merge: true }
         );
      } else {
         setDoc(
            userRef,
            {
               basket: [...snaps.docs[0].data().basket, { productId, category, count: count }]
            },
            { merge: true }
         );
      }
      return { productId, category, count, prod };
   }
);

const userSlice = createSlice({
   name: 'user',
   initialState,
   reducers: {
      removeUser(state) {
         state.email = null;
         state.token = null;
         state.id = null;
         state.lastName = null;
         state.name = null;
         state.isLogged = false;
         state.likedProducts = [];
         state.basket = [];
         state.status = AccStatus.GUEST;
      },
      setUser(state, action: PayloadAction<TUser>) {
         const { email, token, id, lastName, name, likedProducts, basket, status } = action.payload;
         state.email = email;
         state.token = token;
         state.id = id;
         state.lastName = lastName;
         state.name = name;
         state.isLogged = true;
         state.likedProducts = likedProducts;
         state.basket = basket;
         state.status = status;
      }
   },
   extraReducers: (builder) => {
      builder
         .addCase(signIn.fulfilled, (state, action) => {
            state.isLogged = true;
            state.isLoading = false;
            state.email = action.payload.user.email;
            state.token = action.payload.user.refreshToken;
            state.id = action.payload.user.uid;
            state.lastName = action.payload.data.lastName;
            state.name = action.payload.data.name;
            state.basket = action.payload.data.basket;
            state.likedProducts = action.payload.data.likedProducts;
				state.status = action.payload.data.status;
         })
         .addCase(signIn.rejected, (state) => {
            state.isError = true;
            state.isLoading = false;
         })
         .addCase(signIn.pending, (state) => {
            state.isError = false;
            state.isLoading = true;
            state.isLogged = false;
         })
         .addCase(signUp.fulfilled, (state, action) => {
            state.isLogged = true;
            state.isLoading = false;
            state.email = action.payload.user.email;
            state.token = action.payload.user.refreshToken;
            state.id = action.payload.user.uid;
            state.lastName = action.payload.lastName;
            state.name = action.payload.firstName;
            state.basket = [];
            state.likedProducts = [];
				state.status = AccStatus.USER;
         })
         .addCase(signUp.rejected, (state) => {
            state.isError = true;
            state.isLoading = false;
         })
         .addCase(signUp.pending, (state) => {
            state.isError = false;
            state.isLoading = true;
            state.isLogged = false;
         })
         .addCase(addProduct.fulfilled, (state, action) => {
            const { count, category, productId, prod } = action.payload;
            if (prod) {
               state.basket.map((el) => {
                  if (el.productId === productId) {
                     el.count += count;
                  }
                  return el;
               });
            } else {
               console.log(count);

               state.basket.push({ productId, category, count });
            }
         })
         .addCase(removeProduct.fulfilled, (state, action: PayloadAction<string>) => {
            state.basket = state.basket.filter((item) => item.productId !== action.payload);
         })
         .addCase(likeProduct.fulfilled, (state, action: PayloadAction<TLikedType>) => {
            state.likedProducts.push(action.payload);
         })
         .addCase(dislikeProduct.fulfilled, (state, action: PayloadAction<string>) => {
            state.likedProducts = state.likedProducts.filter(
               (el) => el.productId !== action.payload
            );
         });
   }
});

export const { removeUser, setUser } = userSlice.actions;
export default userSlice.reducer;
