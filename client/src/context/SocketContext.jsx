import { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
// Create the context
const SocketContext = createContext();

// Create a custom hook to easily use the socket in other components
export const useSocket = () => {
  return useContext(SocketContext);
};

// Create the provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((store) => store.auth); // Get the logged-in user from your Redux store

  useEffect(() => {
    // Only establish a connection if there is a logged-in user
    if (user) {
      // Connect to the backend, passing the userId as a query parameter.
      // The backend will use this to map the user to their socket ID.
      const newSocket = io("http://localhost:7777", { // IMPORTANT: Use your backend's URL
        query: {
          userId: user._id,
        },
      });

      setSocket(newSocket);

      // Clean up the connection when the component unmounts or when the user logs out.
      return () => newSocket.close();
    } else {
      // If there is no user (e.g., after logout), close any existing socket connection.
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    // The dependency array ensures this effect runs only when the user object changes (login/logout).
  }, [user]);




  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};


SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
    };
    