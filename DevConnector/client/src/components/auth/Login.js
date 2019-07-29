import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const { email, password } = formData;

  //define function onChange which takes an HTML element e
  //and executes the setFormData method
  //setFormData makes a copy of the whole formData object with the 'spread operator': ...formData
  //and also takes the new value from element with e.target.value and sets the value in the copied formData
  //which field is being set is defined from the elements "name" property
  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = e => {
    e.preventDefault();

    console.log("Success");
  };

  return (
    <Fragment>
      <h1 className="large text-primary">Sign In</h1>
      <p className="lead">
        <i className="fas fa-user" /> Access Your Account
      </p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            value={email}
            // this onChange property is set by calling the onChange method above
            // and the HTML element e is extracted and passed to onChange
            onChange={e => onChange(e)}
            //required
          />
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
        <input type="submit" className="btn btn-primary" value="Login" />
      </form>
      <p className="my-1">
        Register an account?
        <Link to="/register"> Register Here</Link>
      </p>
    </Fragment>
  );
};

export default Login;
