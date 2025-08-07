import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
export const ProtectedRoute = ({children}) => {
    const {isAuthenticated} = useSelector(store=>store.auth);

    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }

    return children;
}
export const AuthenticatedUser = ({children}) => {
    const {isAuthenticated} = useSelector(store=>store.auth);

    if(isAuthenticated){
        return <Navigate to="/"/>
    }

    return children;
}

export const AdminRoute = ({children}) => {
    const {user, isAuthenticated} = useSelector(store=>store.auth);

    if(!isAuthenticated){
        return <Navigate to="/login"/>
    }

    if(user?.role !== "instructor"){
        return <Navigate to="/"/>
    }

    return children;
}

AdminRoute.propTypes = {
    children: PropTypes.node.isRequired,   
};
AuthenticatedUser.propTypes = {
    children: PropTypes.node.isRequired,
};
ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};