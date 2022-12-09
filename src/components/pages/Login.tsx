import React, { FormEvent, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { signIn, signUp } from '../../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../../hooks/useNotify';
import { notificationTypes } from '../../types';
import '../../styles/loginStyle.css';

const Login = () => {
   const [showSignIn, setShowSignIn] = useState(true);
   const navigate = useNavigate();
   const dispatch = useAppDispatch();
   const userState = useAppSelector((state) => state.user);
   const [email, setEmail] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const [confirmPassword, setConfirmPassword] = useState<string>('');
   const [firstName, setFirstName] = useState<string>('');
   const [lastName, setLastName] = useState<string>('');
   const notify = useNotify();

   useEffect(() => {
      if (userState.isLogged) {
         localStorage.setItem('currentUser', JSON.stringify(userState));
         navigate('/shop');
      }
   }, [userState.isLogged]);

   const handleSignIn = async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      await dispatch(signIn({ email, password } as { email: string; password: string }))
         .unwrap()
         .catch((e) => notify(notificationTypes.ERROR, e.message));
   };

   const handleSignUp = async (e: FormEvent) => {
      e.preventDefault();
      await dispatch(
         signUp({ email, password, firstName, lastName } as {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
         })
      )
         .unwrap()
         .catch((e) => notify(notificationTypes.ERROR, e.message));
   };

   return (
      <div className="main-container">
         <div
            className={showSignIn ? 'register-container' : 'right-panel-active'}
            id="register-container"
         >
            <div className="form-container sign-up-container">
               <form>
                  <h1>Create Account</h1>
                  <div className="infield">
                     <input
                        type="text"
                        placeholder="Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                     />
                  </div>
                  <div className="infield">
                     <input
                        type="text"
                        placeholder="LastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                     />
                  </div>
                  <div className="infield">
                     <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>
                  <div className="infield">
                     <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
                  <div className="infield">
                     <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={
                        password === confirmPassword
                           ? handleSignUp
                           : (e) => {
                                alert('Passwords are different');
                                e.preventDefault();
                             }
                     }
                  >
                     Sign Up
                  </button>
               </form>
            </div>
            <div className="form-container sign-in-container">
               <form>
                  <h1>Sign in</h1>
                  <div className="infield">
                     <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>
                  <div className="infield">
                     <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
                  <button onClick={handleSignIn}>Sign In</button>
               </form>
            </div>
            <div className="overlay-container" id="overlayCon">
               <div className="overlay">
                  <div className="overlay-panel overlay-left">
                     <h1>Welcome Back!</h1>
                     <p>To keep connected with us please login with your personal info</p>
                     <button>Sign In</button>
                  </div>
                  <div className="overlay-panel overlay-right">
                     <h1>Hello, Friend!</h1>
                     <p>Enter your personal details and start shopping with us</p>
                     <button>Sign Up</button>
                  </div>
               </div>
               <button id="overlayBtn" onClick={() => setShowSignIn(!showSignIn)}></button>
            </div>
         </div>
      </div>
   );
};

export default Login;
