import { Link } from "react-router";
import { useState } from "react";
import { all_routes } from "../../../routes/all_routes";
import ImageWithBasePath from "../../../../core/imageWithBasePath";
import { useAuth } from "../../../../core/context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      
      await login({
        email: formData.email,
        password: formData.password,
      });
      // Navigation is handled by AuthContext after successful login
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <>
      {/* Start Content */}
      <div className="container-fuild position-relative z-1">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          {/* start row */}
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap py-3">
            <div className="col-lg-4 mx-auto">
              <form
                className="d-flex justify-content-center align-items-center"
                onSubmit={handleSubmit}
              >
                <div className="d-flex flex-column justify-content-lg-center p-4 p-lg-0 pb-0 flex-fill">
                  <div className=" mx-auto mb-4 text-center">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                    />
                  </div>
                  <div className="card border-1 p-lg-3 shadow-md rounded-3 mb-4">
                    <div className="card-body">
                      <div className="text-center mb-3">
                        <h5 className="mb-1 fs-20 fw-bold">Sign In</h5>
                        <p className="mb-0">
                          Please enter below details to access the dashboard
                        </p>
                      </div>
                      {error && (
                        <div className="alert alert-danger py-2" role="alert">
                          {error}
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <div className="input-group">
                          <span className="input-group-text border-end-0 bg-white">
                            <i className="ti ti-mail fs-14 text-dark" />
                          </span>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-control border-start-0 ps-0"
                            placeholder="Enter Email Address"
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="position-relative">
                          <div className="pass-group input-group position-relative border rounded">
                            <span className="input-group-text bg-white border-0">
                              <i className="ti ti-lock text-dark fs-14" />
                            </span>
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className="pass-input form-control ps-0 border-0"
                              placeholder="****************"
                              required
                            />
                            <button
                              type="button"
                              className="input-group-text bg-white border-0"
                              onClick={togglePasswordVisibility}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              <i
                                className={`ti toggle-password ${
                                  showPassword ? "ti-eye" : "ti-eye-off"
                                } text-dark fs-14`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input
                              className="form-check-input"
                              id="remember_me"
                              type="checkbox"
                              name="remember"
                              checked={formData.remember}
                              onChange={handleChange}
                            />
                            <label
                              htmlFor="remember_me"
                              className="form-check-label mt-0 text-dark"
                            >
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <div className="text-end">
                          {/* <Link
                            to={all_routes.forgotpasswordbasic}
                            className="text-danger"
                          >
                            Forgot Password?
                          </Link> */}
                        </div>
                      </div>
                      <div className="mb-2">
                        <button
                          type="submit"
                          className="btn bg-primary text-white w-100"
                          disabled={loading}
                        >
                          {loading ? "Signing in..." : "Login"}
                        </button>
                      </div>
                      {/* <div className="login-or position-relative mb-3">
                        <span className="span-or">OR</span>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-center flex-wrap">
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/facebook-logo.svg"
                                alt="Facebook"
                              />
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/google-logo.svg"
                                alt="Google"
                              />
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-1 btn btn-outline-light border d-flex align-items-center justify-content-center"
                            >
                              <ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/apple-logo.svg"
                                alt="apple"
                              />
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal fs-14 text-dark mb-0">
                          Don’t have an account yet?
                          <Link to={all_routes.registerbasic} className="hover-a">
                            
                            Register
                          </Link>
                        </h6>
                      </div> */}
                    </div>
                    {/* end card body */}
                  </div>
                  {/* end card */}
                </div>
              </form>
              <p className="text-dark text-center">
                
                Copyright © 2025 - Preclinic
              </p>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
        </div>
      </div>
      {/* End Content */}
    </>
  );
};

export default Login;
