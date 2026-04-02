import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProductDetails from "./Components/ProductDetails.jsx";
import "./index.css";

import App from "./App.jsx";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { Toaster } from "react-hot-toast";
import Home from "./Components/Home.jsx";
import Pricing from "./Components/Pricing.jsx";
import Products from "./Components/Products.jsx";
import ContactUs from "./Components/ContactUs.jsx";
import Checkout from "./Components/Checkout.jsx";

// // Admin
import AdminPanel from "./Admin/AdminPanel.jsx";
import Dashboard from "./Admin/Dashboard/Dashboard.jsx";
import Billings from "./Admin/Billing/Billins.jsx";
import Inventory from "./Admin/Inventory/Inventory.jsx";

import Reports from "./Admin/Reports/Reports.jsx";
import Settings from "./Admin/Settingss/Settings.jsx"
import BookingService from "./Admin/Bookingservice/BookingService.jsx";
import AddBilling from "./Admin/Billing/AddBilling.jsx";
import AddInventoryItem from "./Admin/Inventory/AddInventoryItem.jsx";
import ProfileSettings from "./Admin/Settingss/ProfileSettings.jsx";
import UserManagement from "./Admin/Settingss/UserManagement.jsx";
import Staffs from "./Admin/Employees/Staffs.jsx";
import AddEditStaff from "./Admin/Employees/AddStaff.jsx";
import ViewStaff from "./Admin/Employees/ViewStaff.jsx";
import Users from "./Admin/Users/Users.jsx";

import OverallAttendance from "./Admin/Attendance/OverallAttendance.jsx";
import ReviewsSettings from "./Admin/Settingss/Review.jsx"
import CarServices from "./Admin/CarServices/CarServices.jsx";
import AddServices from "./Admin/CarServices/AddCarServices.jsx";
import Servicestype from "./Admin/ServicesProvider/Services.jsx";
import AddServicesType from "./Admin/ServicesProvider/AddServices.jsx";
import ViewService from "./Admin/ServicesProvider/ViewCarservices.jsx";
import AddServiceParts from "./Admin/ServicesProvider/Addpairparts.jsx";
import AllProducts from "./Admin/Products/AllProducts.jsx";
import AddProducts from "./Admin/Products/AddProducts.jsx";
import AddStock from "./Admin/Products/AddStock.jsx";
import StockDetails from "./Admin/Products/StockDetails.jsx";
import AddCarServices from "./Admin/ServicesList/AddSerivess.jsx";
import ServicesListAll from "./Admin/ServicesList/ServicesListAll.jsx";
import Services from "./Components/Services.jsx";
import About from "./Components/About.jsx";
import ServiceDetails from "./Components/ServiceDetails.jsx";
import PricingList from "./Admin/PricingAll/AllPricesList.jsx";
import PricingForm from "./Admin/PricingAll/AddPrice.jsx";
import ProductBilling from "./Admin/Products/ProductBill.jsx";
import ShowAllBookings from "./Admin/Bookingservice/BookingShowAll.jsx";
import AddServiceVehicle from "./Admin/Bookingservice/AddServiceVehicle.jsx";
import AdminAppointments from "./Admin/Appointments/AdminAppointments.jsx";
import Contact from "./Components/ContactUs.jsx";
import BookService from "./Components/BookService.jsx";
import BookAppointment from "./Components/BookAppointment.jsx";
import Account from "./Components/Account.jsx";
import Cart from "./Components/Cart.jsx";
import BuyVehicles from "./Components/BuyVehicles.jsx";
import AllOrders from "./Admin/Orders/All Orders.jsx";
import OrderDetails from "./Admin/Orders/OrderDetails.jsx";
import AdminAssignServices from "./Admin/Bookingservice/AdminAssignServices.jsx";
import AdminAddAppointment from "./Admin/Appointments/AdminAddAppointment.jsx";
import ServiceAreas from "./Admin/ServiceAreas.jsx";

// Bike Marketplace
import AllBikes from "./Admin/Bikes/AllBikes.jsx";
import AddBike from "./Admin/Bikes/AddBike.jsx";
import BookedVehicles from "./Admin/Bikes/BookedVehicles.jsx";



import EmpAdminLayout from "./EmployeeAdmin/EmpAdminPanel.jsx";
import EmpDashboard from "./EmployeeAdmin/Dashboard/EmpDashboard.jsx";
import EmpCars from "./EmployeeAdmin/EmpCars/EmpCars.jsx";
import EmpAssingCars from "./EmployeeAdmin/EmpBookAssingcar/EmpAssingCars.jsx";
import EmpBilling from "./EmployeeAdmin/EmpBilling/EmpBilling.jsx";
import EmpAddBilling from "./EmployeeAdmin/EmpBilling/EmpAddBilling.jsx";
import EmpBookings from "./EmployeeAdmin/EmpBookings/EmpBookings.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "/services", element: <Services /> },
      { path: "/pricing", element: <Pricing /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/products", element: <Products /> },
      { path: "/products/:slug", element: <ProductDetails /> },
      { path: "/services/:id", element: <ServiceDetails /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <ContactUs /> },
      { path: "/buy-vehicles", element: <BuyVehicles /> },
      { path: "/cart", element: <Cart /> },
      { path: "/bookservice", element: <BookService /> },
      { path: "/bookappointment", element: <BookAppointment /> },
      { path: "/account", element: <Account /> },
    ],
  },

  {
    path: "/employee",
    element: (
      <PrivateRoute allowedRoles={["employee", "manager", "staff", "receptionist", "gym_manager", "mechanic"]}>
        <EmpAdminLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <EmpDashboard /> },
      { path: "cars", element: <EmpCars /> },
      { path: "assignservices", element: <EmpAssingCars /> },
      { path: "bookings", element: <EmpBookings /> },
      { path: "services", element: <Servicestype /> },
      { path: "billing", element: <EmpBilling /> },
      { path: "addbillings", element: <EmpAddBilling /> },
      { path: "addserviceparts", element: <AddServiceParts /> },
    ]
  },

  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin", "manager", "staff", "receptionist", "gym_manager", "mechanic"]}>
        <AdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "services", element: <Servicestype /> },
      { path: "services/:id", element: <ViewService /> },
      { path: "addservicestype", element: <AddServicesType /> },
      { path: "addserviceparts", element: <AddServiceParts /> },
      { path: "bookings", element: <ShowAllBookings /> },
      { path: "appointments", element: <AdminAppointments /> },
      { path: "book-appointment", element: <AdminAddAppointment /> },
      { path: "addbooking", element: <BookingService /> },
      { path: "assignservices", element: <AdminAssignServices /> },
      { path: "addservicevehicle", element: <AddServiceVehicle /> },
      { path: "service-areas", element: <ServiceAreas /> },
      // { path: "contact", element: <Contact /> },

      { path: "orders", element: <AllOrders /> },
      { path: "orders/:id", element: <OrderDetails /> },

      { path: "inventory-list", element: <AllBikes defaultType="all" /> },
      { path: "add-vehicle", element: <AddBike defaultType="Car" /> },
      { path: "add-vehicle/:id", element: <AddBike defaultType="all" /> },
      { path: "booked-vehicles", element: <BookedVehicles /> },




      { path: "allProducts", element: <AllProducts /> },
      { path: "addproducts", element: <AddProducts /> },
      { path: "addstock", element: <AddStock /> },
      { path: "stockdetails", element: <StockDetails /> },


      { path: "addservices", element: <AddCarServices /> },
      { path: "addservices/:id", element: <AddCarServices /> },
      { path: "serviceslist", element: <ServicesListAll /> },


      { path: "priceslist", element: <PricingList /> },
      { path: "addprice", element: <PricingForm /> },
      { path: "addprice/:id", element: <PricingForm /> },



      { path: "carservies", element: <CarServices /> },
      { path: "addcarservies", element: <AddServices /> },
      { path: "addcarservies/:id", element: <AddServices /> },



      // { path: "treatments", element: <Treatments /> },
      // { path: "addtreatments", element: <AddTreatment /> },
      // { path: "addtreatments/:id", element: <AddTreatment /> },
      // { path: "viewtreatment/:id", element: <ViewTreatment /> },

      { path: "productbilling", element: <ProductBilling /> },


      { path: "billing", element: <Billings /> },
      { path: "addbillings", element: <AddBilling /> },
      { path: "addbillings/:id", element: <AddBilling /> },

      { path: "inventory", element: <Inventory /> },
      { path: "additemsinventory", element: <AddInventoryItem /> },
      { path: "additemsinventory/:id", element: <AddInventoryItem /> },

      // { path: "equipment", element: <Equipment /> },
      // { path: "addequipment", element: <AddEditEquipment /> },
      // { path: "addequipment/:id", element: <AddEditEquipment /> },
      // { path: "viewequipment/:id", element: <ViewEquipment /> },


      { path: "reports", element: <Reports /> },

      { path: "customers", element: <Users /> },
      // { path: "addupdateuser", element: <AddEditUser /> },
      // { path: "addupdateuser/:id", element: <AddEditUser /> },
      // 
      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },
      // { path: "settings/billing", element: <BillingSettings /> },
      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },
      { path: "employees", element: <Staffs /> },
      { path: "addstaff", element: <AddEditStaff /> },
      { path: "addstaff/:id", element: <AddEditStaff /> },
      { path: "viewstaff/:id", element: <ViewStaff /> },
      { path: "overall-attendance", element: <OverallAttendance /> },
    ],
  },
  // {
  //   path: "*",
  //   element: <PageNotFound />,
  // },
]);

import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        {/* 🔔 GLOBAL TOASTER */}
        <Toaster
          position="top-left"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#0B3C8A",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#7CB9FF",
                secondary: "#fff",
              },
            },
            error: {
              style: {
                background: "#DC2626",
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

