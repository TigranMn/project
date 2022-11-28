import React, { useState } from 'react';
import { Container } from '@mui/material';
import { useAppDispatch } from '../../store';
import { setUser } from '../../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignIn() {
   const navigate = useNavigate();
   const dispatch = useAppDispatch();
   const [email, setEmail] = useState<string>('');
   const [password, setPassword] = useState<string>('');

   const handleSignIn = (e: React.SyntheticEvent) => {
      e.preventDefault();
      signInWithEmailAndPassword(auth, email, password)
         .then(({ user }) => {
            dispatch(
               setUser({
                  email: user?.email,
                  token: user?.refreshToken,
                  id: user?.uid
               })
            );
            navigate('/shop');
            return user;
         })
         .then((user) => {
            localStorage.setItem(
               'currentUser',
               JSON.stringify({
                  email: user.email,
                  token: user.refreshToken,
                  id: user.uid
               })
            );
         })
         .catch(() => {
            console.log('email or password is invalid!');
         })
         .finally(() => {
            setEmail('');
            setPassword('');
         });
   };

   return (
      <Container sx={{ mt: '20px' }}>
         <form onSubmit={handleSignIn}>
            <input
               placeholder="Email"
               type="email"
               onChange={(e) => setEmail(e.target.value)}
               value={email}
            />
            <br />
            <br />
            <input
               placeholder="password"
               type="password"
               onChange={(e) => setPassword(e.target.value)}
               value={password}
            />

            <br />
            <br />
            <button type="submit">Sign In</button>

            <br />
            <br />
            <p>
               Don't have an account ?{' '}
               <button
                  onClick={() => {
                     navigate('/signup');
                  }}
               >
                  Create an account!
               </button>
            </p>
         </form>
      </Container>
   );
}