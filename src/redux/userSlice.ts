import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   UserCredential
} from 'firebase/auth';
import {
   addDoc,
   collection,
   doc,
   DocumentData,
   getDocs,
   query,
   QuerySnapshot,
   setDoc,
   where
} from 'firebase/firestore';
import { getUser } from '../api/api';
import { auth, db } from '../firebase';

type TState = {
   email: string | null;
   id: string | null;
   token: string | null;
   name: string | null;
   lastName: string | null;
   isLoading: boolean;
   isError: boolean;
   isLogged: boolean;
};

const initialState: TState = {
   email: null,
   id: null,
   token: null,
   name: null,
   lastName: null,
   isError: false,
   isLogged: false,
   isLoading: false
};

export const signIn = createAsyncThunk(
   'user/signIn',
   async (
      { email, password }: { email: string; password: string },
      { rejectWithValue }
   ) => {
      try {
         const { user }: UserCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
         );
         const data = await getUser(user);
         return { data, user };
      } catch (e) {
         if (e instanceof Error) {
            throw new Error(e.message);
         }
         throw new Error('Something went wrong');
      }
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
      try {
         const { user }: UserCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
         );
         addDoc(collection(db, 'users'), {
            name: firstName,
            lastName,
            email: user.email,
            id: user.uid,
            likedProducts: [],
            basket: []
         });
         return { user, firstName, lastName };
      } catch {
         throw new Error('Something went wrong');
      }
   }
);

export const addProduct = createAsyncThunk(
   'basket/addProduct',
   async ({
      productId,
      userId,
      category,
      count = 1
   }: {
      productId: string;
      userId: string;
      category: string;
      count?: number;
   }) => {
      let collRef = collection(db, 'users');
      let q = query(collRef, where('id', '==', userId));
      let snaps: QuerySnapshot<DocumentData> = await getDocs(q);
      const userRef = doc(db, 'users', snaps.docs[0].id);

      let prod = [...snaps.docs[0].data().basket].find((el) => {
         return el.productId === productId;
      });
      if (prod) {
         setDoc(
            userRef,
            {
               basket: [
                  ...[...snaps.docs[0].data().basket].filter(
                     (el) => el.productId !== productId
                  ),
                  { ...prod, count: prod.count + count }
               ]
            },
            { merge: true }
         );
      } else {
         setDoc(
            userRef,
            {
               basket: [
                  ...snaps.docs[0].data().basket,
                  { productId, category, count: count }
               ]
            },
            { merge: true }
         );
      }
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
         })
         .addCase(signIn.rejected, (state) => {
            state.isError = true;
            state.isLoading = false;
            console.log(2);
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
         })
         .addCase(signUp.rejected, (state) => {
            state.isError = true;
            state.isLoading = false;
         })
         .addCase(signUp.pending, (state) => {
            state.isError = false;
            state.isLoading = true;
            state.isLogged = false;
         });
   }
});

export const { removeUser } = userSlice.actions;
export default userSlice.reducer;
