import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";

module {
  public type AppRole = {
    #Admin;
    #Member;
  };

  public type UserProfile = {
    id : Principal;
    name : Text;
    email : Text;
    role : AppRole;
    profilePic : ?Storage.ExternalBlob;
  };

  public type MembershipPlan = {
    id : Text;
    name : Text;
    durationMonths : Nat;
    price : Nat;
    benefits : Text;
  };

  public type SerializeMemberProfile = {
    id : Text;
    principal : Text;
    name : Text;
    email : Text;
    phone : Text;
    membershipStatus : MembershipStatus;
    startDate : Text;
    endDate : Text;
    workoutPlan : ?WorkoutPlan;
    dietPlan : ?DietPlan;
    membershipPlan : MembershipPlan;
    profilePic : ?Storage.ExternalBlob;
  };

  public type MembershipStatus = {
    #active;
    #expired;
    #pending;
  };

  public type Expense = {
    id : Text;
    description : Text;
    amount : Nat;
    timestamp : Time.Time;
    type_ : ExpenseType;
  };

  public type PaymentStatus = {
    #paid;
    #pending;
    #failed;
  };

  public type ExpenseType = {
    #equipment;
    #rent;
    #utilities;
    #other;
  };

  public type ClassBooking = {
    id : Text;
    memberId : Principal;
    classType : ClassType;
    date : Time.Time;
    status : BookingStatus;
  };

  public type ClassType = {
    #yoga;
    #zumba;
    #crossfit;
    #pilates;
  };

  public type BookingStatus = {
    #booked;
    #cancelled;
    #completed;
  };

  public type AttendanceRecord = {
    memberId : Principal;
    checkInTime : Time.Time;
    checkOutTime : ?Time.Time;
  };

  public type WorkoutPlan = {
    id : Text;
    name : Text;
    description : Text;
    exercises : [Exercise];
    durationWeeks : Nat;
  };

  public type Exercise = {
    name : Text;
    sets : Nat;
    reps : Nat;
    weightKg : Nat;
  };

  public type DietPlan = {
    id : Text;
    name : Text;
    description : Text;
    meals : [Meal];
    calories : Nat;
    proteinG : Nat;
    carbsG : Nat;
    fatG : Nat;
  };

  public type CommunicationLog = {
    to : Text;
    channel : CommunicationChannel;
    content : Text;
    timestamp : Time.Time;
    status : CommunicationStatus;
  };

  public type CommunicationChannel = {
    #email;
    #sms;
    #whatsapp;
  };

  public type CommunicationStatus = {
    #sent;
    #failed;
    #pending;
  };

  public type ManualCreateMemberResponse = {
    member : SerializeMemberProfile;
    credentials : Credentials;
    communicationLogs : [CommunicationLogEntry];
  };

  public type Credentials = {
    email : Text;
    password : Text;
  };

  public type CommunicationLogEntry = {
    channel : CommunicationChannel;
    content : Text;
    timestamp : Time.Time;
    status : CommunicationStatus;
  };

  public type MemberCredentials = {
    email : Text;
    password : Text;
  };

  public type CreateMemberRequest = {
    name : Text;
    phone : Text;
    membershipPlan : MembershipPlan;
    profilePic : ?Storage.ExternalBlob;
  };

  public type CreateMemberResponse = {
    member : SerializeMemberProfile;
    credentials : MemberCredentials;
    communicationLogs : [CommunicationLogEntry];
  };

  public type RegisteredMemberInfo = {
    id : Principal;
    name : Text;
    email : Text;
    phone : Text;
  };

  public type MinimalMember = {
    id : Nat;
    name : Text;
  };

  public type Payment = {
    id : Text;
    memberId : Principal;
    amount : Nat;
    timestamp : Time.Time;
    status : PaymentStatus;
  };

  public type MemberProfile = {
    id : Nat;
    principal : Principal;
    name : Text;
    email : Text;
    phone : Text;
    membershipStatus : MembershipStatus;
    startDate : Time.Time;
    endDate : Time.Time;
    workoutPlan : ?WorkoutPlan;
    dietPlan : ?DietPlan;
    membershipPlan : MembershipPlan;
    profilePic : ?Storage.ExternalBlob;
  };

  public type Meal = {
    name : Text;
    description : Text;
    calories : Nat;
    proteinG : Nat;
    carbsG : Nat;
    fatG : Nat;
  };

  public type OldActor = {
    memberIdCounter : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminRegistered : Bool;
    userProfiles : Map.Map<Principal, UserProfile>;
    minimalMembers : Map.Map<Nat, MinimalMember>;
    members : Map.Map<Nat, MemberProfile>;
    payments : Map.Map<Text, Payment>;
    expenses : Map.Map<Text, Expense>;
    classBookings : Map.Map<Text, ClassBooking>;
    attendance : Map.Map<Nat, [AttendanceRecord]>;
    qrCodes : Map.Map<Nat, Text>;
    membershipPlans : Map.Map<Text, MembershipPlan>;
    registeredMembers : Map.Map<Principal, RegisteredMemberInfo>;
    memberCredentials : Map.Map<Text, Text>;
    communicationLogs : Map.Map<Text, CommunicationLogEntry>;
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
  };

  public type NewActor = {
    memberIdCounter : Nat;
    stripeConfig : ?Stripe.StripeConfiguration;
    adminRegistered : Bool;
    userProfiles : Map.Map<Principal, UserProfile>;
    minimalMembers : Map.Map<Nat, MinimalMember>;
    members : Map.Map<Nat, MemberProfile>;
    payments : Map.Map<Text, Payment>;
    expenses : Map.Map<Text, Expense>;
    classBookings : Map.Map<Text, ClassBooking>;
    attendance : Map.Map<Nat, [AttendanceRecord]>;
    qrCodes : Map.Map<Nat, Text>;
    membershipPlans : Map.Map<Text, MembershipPlan>;
    registeredMembers : Map.Map<Principal, RegisteredMemberInfo>;
    memberCredentials : Map.Map<Text, Text>;
    communicationLogs : Map.Map<Text, CommunicationLogEntry>;
    accessControlState : AccessControl.AccessControlState;
    approvalState : UserApproval.UserApprovalState;
    emailToPrincipal : Map.Map<Text, Principal>;
  };

  public func run(old : OldActor) : NewActor {
    { old with emailToPrincipal = Map.empty<Text, Principal>() };
  };
};
