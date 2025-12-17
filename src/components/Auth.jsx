import { SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';

import { Navigate } from 'react-router-dom';



export const ProtectedRoute = ({ children }) => {

  const { isLoaded, isSignedIn } = useUser();



  if (!isLoaded) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>

      </div>

    );

  }



  // Allow access to all routes regardless of sign-in status
  return children;

};



export const SignInPage = () => {

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <SignIn

        appearance={{

          elements: {

            rootBox: "mx-auto",

            card: "shadow-xl"

          }

        }}

        routing="path"

        path="/sign-in"

        signUpUrl="/sign-up"

      />

    </div>

  );

};



export const SignUpPage = () => {

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <SignUp

        appearance={{

          elements: {

            rootBox: "mx-auto",

            card: "shadow-xl"

          }

        }}

        routing="path"

        path="/sign-up"

        signInUrl="/sign-in"

      />

    </div>

  );

};



export { UserButton };