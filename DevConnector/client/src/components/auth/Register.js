import React, { Fragment, useState } from "react";

//connect the alert reducer to this file using connect
import { connect } from "react-redux";
import { Link, Redirect, withRouter } from "react-router-dom";
import { setAlert } from "../../actions/alert";
import { register } from "../../actions/auth";
import PropTypes from "prop-types";

const Register = ({ setAlert, register, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confPassword: ""
  });

  const { name, email, password, confPassword } = formData;

  //define function onChange which takes an HTML element e
  //and executes the setFormData method
  //setFormData makes a copy of the whole formData object with the 'spread operator': ...formData
  //and also takes the new value from element with e.target.value and sets the value in the copied formData
  //which field is being set is defined from the elements "name" property
  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = e => {
    e.preventDefault();
    console.log("isAuthenticated: " + isAuthenticated);
    if (password !== confPassword) {
      setAlert("Your passwords do not match", "danger");
    } else {
      register({ name, email, password });
    }
  };

  //Redirect if already authenticated
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <Fragment>
      <h1 className="large text-primary">Sign Up</h1>
      <p className="lead">
        <i className="fas fa-user" /> Create Your Account
      </p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={name}
            // this onChange property is set by calling the onChange method above
            // and the HTML element e is extracted and passed to onChange
            onChange={e => onChange(e)}
            //required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            onChange={e => onChange(e)}
            //required
          />
          <small className="form-text">
            This site uses Gravatar so if you want a profile image, use a
            Gravatar email
          </small>
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            name="password"
            //minLength="6"
            value={password}
            onChange={e => onChange(e)}
            //required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            name="confPassword"
            //minLength="6"
            value={confPassword}
            onChange={e => onChange(e)}
            //required
          />
        </div>
        <input type="submit" className="btn btn-primary" value="Register" />
      </form>
      <p className="my-1">
        Already have an account?
        <Link to="/login"> Login Here</Link>
      </p>
    </Fragment>
  );
};

Register.proptype = {
  setAlert: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated
});

export default withRouter(
  connect(
    mapStateToProps,
    { setAlert, register }
  )(Register)
);
