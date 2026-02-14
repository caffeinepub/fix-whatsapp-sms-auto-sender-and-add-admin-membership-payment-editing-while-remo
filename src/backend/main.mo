import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import OutCall "http-outcalls/outcall";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

// Attach the migration module via the `with` clause
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let approvalState = UserApproval.initState(accessControlState);

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

  public type Payment = {
    id : Text;
    memberId : Principal;
    email : Text;
    amount : Nat;
    timestamp : Time.Time;
    status : PaymentStatus;
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

  public type Meal = {
    name : Text;
    description : Text;
    calories : Nat;
    proteinG : Nat;
    carbsG : Nat;
    fatG : Nat;
  };

  public type ReportMember = {
    member : MemberProfile;
    moneyDue : Nat;
    isExpiringSoon : Bool;
    isExpired : Bool;
  };

  public type ReportSummary = {
    monthlyRevenue : Nat;
    totalPayments : Nat;
    totalExpenses : Nat;
    profit : Nat;
    members : [ReportMember];
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
    member : MemberProfile;
    credentials : MemberCredentials;
    communicationLogs : [CommunicationLogEntry];
  };

  public type MemberWithCredentials = {
    member : MemberProfile;
    credentials : MemberCredentials;
  };

  public type Credentials = {
    email : Text;
    password : Text;
  };

  public type ManualCreateMemberRequest = {
    name : Text;
    credentials : Credentials;
    phone : Text;
    membershipPlan : MembershipPlan;
    profilePic : ?Storage.ExternalBlob;
  };

  public type ManualCreateMemberResponse = {
    member : MemberProfile;
    credentials : Credentials;
    communicationLogs : [CommunicationLogEntry];
  };

  public type Notification = {
    title : Text;
    message : Text;
    icon : Text;
    color : Text;
    priority : Nat;
    actions : [(Text, Text)];
    timestamp : Time.Time;
  };

  var memberIdCounter = 1;
  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var adminRegistered : Bool = false;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let minimalMembers = Map.empty<Nat, MinimalMember>();
  let members = Map.empty<Nat, MemberProfile>();
  let payments = Map.empty<Text, Payment>();
  let expenses = Map.empty<Text, Expense>();
  let classBookings = Map.empty<Text, ClassBooking>();
  let attendance = Map.empty<Nat, [AttendanceRecord]>();
  let qrCodes = Map.empty<Nat, Text>();
  let membershipPlans = Map.empty<Text, MembershipPlan>();
  let registeredMembers = Map.empty<Principal, RegisteredMemberInfo>();
  let memberCredentials = Map.empty<Text, Text>();
  let communicationLogs = Map.empty<Text, CommunicationLogEntry>();
  let emailToPrincipal = Map.empty<Text, Principal>();

  func generateId() : Text {
    let id = "id" # memberIdCounter.toText();
    memberIdCounter += 1;
    id;
  };

  func generateMemberId() : Nat {
    let id = memberIdCounter;
    memberIdCounter += 1;
    id;
  };

  func isAppAdmin(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) { case (#Admin) { true }; case (_) { false } };
      };
      case (null) { false };
    };
  };

  func isMemberWithStatus(caller : Principal, status : MembershipStatus) : Bool {
    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        return member.membershipStatus == status;
      };
    };
    false;
  };

  func isActiveMember(caller : Principal) : Bool {
    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        return member.membershipStatus == #active;
      };
    };
    false;
  };

  func getMemberIdByPrincipal(principal : Principal) : ?Nat {
    for ((id, member) in members.entries()) {
      if (member.principal == principal) {
        return ?id;
      };
    };
    null;
  };

  func isEmailUnique(email : Text) : Bool {
    if (memberCredentials.get(email) != null) { return false };

    for ((_, member) in members.entries()) {
      if (member.email == email) { return false };
    };

    for ((_, regMember) in registeredMembers.entries()) {
      if (regMember.email == email) { return false };
    };

    true;
  };

  func getMemberByEmail(email : Text) : ?MemberProfile {
    for ((_, member) in members.entries()) {
      if (member.email == email) {
        return ?member;
      };
    };
    null;
  };

  func getMemberByPhone(phone : Text) : ?MemberProfile {
    for ((_, member) in members.entries()) {
      if (member.phone == phone) {
        return ?member;
      };
    };
    null;
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) { return true };
    UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query func isAdminRegistered() : async Bool {
    adminRegistered;
  };

  public query ({ caller }) func getRegisteredMembers() : async [RegisteredMemberInfo] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view registered members");
    };
    registeredMembers.values().toArray();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile = { profile with id = caller };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getUserRole(target : Principal) : async AccessControl.UserRole {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view user roles");
    };
    AccessControl.getUserRole(accessControlState, target);
  };

  public shared ({ caller }) func assignRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func getMembershipPlan(id : Text) : async MembershipPlan {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view membership plans");
    };
    switch (membershipPlans.get(id)) {
      case (null) { Runtime.trap("Membership plan not found") };
      case (?plan) { plan };
    };
  };

  public query ({ caller }) func getAllMembershipPlans() : async [MembershipPlan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view membership plans");
    };
    membershipPlans.values().toArray();
  };

  public shared ({ caller }) func addMembershipPlan(plan : MembershipPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add membership plans");
    };
    membershipPlans.add(plan.id, plan);
  };

  public shared ({ caller }) func updateMembershipPlan(plan : MembershipPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update membership plans");
    };
    membershipPlans.add(plan.id, plan);
  };

  public shared ({ caller }) func deleteMembershipPlan(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete membership plans");
    };
    membershipPlans.remove(id);
  };

  public query ({ caller }) func getMember(id : Nat) : async MemberProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view member details");
    };

    let member = switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?m) { m };
    };

    if (member.principal == caller) { return member };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other members' profiles");
    };
    member;
  };

  public shared ({ caller }) func createMemberWithCredentials(_ : CreateMemberRequest) : async CreateMemberResponse {
    Runtime.trap("Auto-generated credentials are not supported. Manual credential setting is required.");
  };

  public shared ({ caller }) func addMember(name : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add members");
    };

    let uniqueId = generateMemberId();

    let minimalMember : MinimalMember = {
      id = uniqueId;
      name;
    };

    minimalMembers.add(uniqueId, minimalMember);
    uniqueId;
  };

  public shared ({ caller }) func updateMember(id : Nat, member : MemberProfile) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update members");
    };

    let existingMember = switch (members.get(id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?m) { m };
    };

    if (member.id != id) {
      Runtime.trap("Invalid member update: ID mismatch");
    };

    if (member.principal != existingMember.principal) {
      Runtime.trap("Invalid member update: Cannot change member principal");
    };

    if (member.email != existingMember.email) {
      if (memberCredentials.get(member.email) != null) {
        Runtime.trap("Invalid member update: Email already exists in credentials");
      };

      for ((otherId, otherMember) in members.entries()) {
        if (otherId != id and otherMember.email == member.email) {
          Runtime.trap("Invalid member update: Email already in use by another member");
        };
      };
    };

    members.add(id, member);
  };

  public shared ({ caller }) func deleteMember(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete members");
    };

    switch (members.get(id)) {
      case (?member) {
        memberCredentials.remove(member.email);
        emailToPrincipal.remove(member.email);
      };
      case (null) {};
    };

    members.remove(id);
    qrCodes.remove(id);
    attendance.remove(id);
    minimalMembers.remove(id);
  };

  public query ({ caller }) func getAllMinimalMembers() : async [MinimalMember] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view members");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all members");
    };
    minimalMembers.values().toArray();
  };

  public query ({ caller }) func getAllMembers() : async [MemberProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view members");
    };
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all members");
    };
    members.values().toArray();
  };

  public shared ({ caller }) func updateMemberWorkoutPlan(memberId : Nat, plan : WorkoutPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update workout plans");
    };

    let member = switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?m) { m };
    };

    let updatedMember = {
      id = member.id;
      principal = member.principal;
      name = member.name;
      email = member.email;
      phone = member.phone;
      membershipStatus = member.membershipStatus;
      startDate = member.startDate;
      endDate = member.endDate;
      workoutPlan = ?plan;
      dietPlan = member.dietPlan;
      membershipPlan = member.membershipPlan;
      profilePic = member.profilePic;
    };

    members.add(memberId, updatedMember);
  };

  public shared ({ caller }) func updateMemberDietPlan(memberId : Nat, plan : DietPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update diet plans");
    };

    let member = switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?m) { m };
    };

    let updatedMember = {
      id = member.id;
      principal = member.principal;
      name = member.name;
      email = member.email;
      phone = member.phone;
      membershipStatus = member.membershipStatus;
      startDate = member.startDate;
      endDate = member.endDate;
      workoutPlan = member.workoutPlan;
      dietPlan = ?plan;
      membershipPlan = member.membershipPlan;
      profilePic = member.profilePic;
    };

    members.add(memberId, updatedMember);
  };

  public shared ({ caller }) func addPayment(payment : Payment) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };

    // Validate that the email belongs to an existing member
    let member = switch (getMemberByEmail(payment.email)) {
      case (null) { Runtime.trap("Invalid payment: Email does not belong to any member") };
      case (?m) { m };
    };

    // Validate that the memberId matches the member with this email
    if (member.principal != payment.memberId) {
      Runtime.trap("Invalid payment: Member ID does not match the email provided");
    };

    payments.add(payment.id, payment);
  };

  public shared ({ caller }) func addPaymentByEmail(
    email : Text,
    amount : Nat,
    status : PaymentStatus
  ) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };

    let member = switch (getMemberByEmail(email)) {
      case (null) { Runtime.trap("Invalid payment: Email does not belong to any member") };
      case (?m) { m };
    };

    let paymentId = generateId();
    let payment : Payment = {
      id = paymentId;
      memberId = member.principal;
      email = member.email;
      amount;
      timestamp = Time.now();
      status;
    };

    payments.add(paymentId, payment);
    paymentId;
  };

  public shared ({ caller }) func addPaymentByPhone(
    phone : Text,
    amount : Nat,
    status : PaymentStatus
  ) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add payments");
    };

    let member = switch (getMemberByPhone(phone)) {
      case (null) { Runtime.trap("Invalid payment: Phone number does not belong to any member") };
      case (?m) { m };
    };

    let paymentId = generateId();
    let payment : Payment = {
      id = paymentId;
      memberId = member.principal;
      email = member.email;
      amount;
      timestamp = Time.now();
      status;
    };

    payments.add(paymentId, payment);
    paymentId;
  };

  // New method: Update payment (admin only)
  public shared ({ caller }) func updatePayment(payment : Payment) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update payments");
    };

    switch (payments.get(payment.id)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?_) {
        payments.add(payment.id, payment);
      };
    };
  };

  // New method: Delete payment (admin only)
  public shared ({ caller }) func deletePayment(paymentId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete payments");
    };

    switch (payments.get(paymentId)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?_) {
        payments.remove(paymentId);
      };
    };
  };

  // New method: Delete expense (admin only)
  public shared ({ caller }) func deleteExpense(expenseId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete expenses");
    };

    switch (expenses.get(expenseId)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?_) {
        expenses.remove(expenseId);
      };
    };
  };

  public query ({ caller }) func getPayment(id : Text) : async Payment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view payments");
    };

    let payment = switch (payments.get(id)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) { payment };
    };

    if (payment.memberId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own payments");
    };

    payment;
  };

  public query ({ caller }) func getMemberPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };

    // Find the member profile for the caller
    var callerMember : ?MemberProfile = null;
    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        callerMember := ?member;
      };
    };

    let memberProfile = switch (callerMember) {
      case (null) { Runtime.trap("Only registered members can view payments") };
      case (?m) { m };
    };

    // Return payments that match either the principal OR the email
    // This ensures payments recorded via email lookup are included
    payments.values().toArray().filter(
      func(p) { 
        p.memberId == caller or p.email == memberProfile.email 
      }
    );
  };

  public query ({ caller }) func getPaymentsByEmail(email : Text) : async [Payment] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can look up payments by email");
    };

    // Validate that the email belongs to a member
    switch (getMemberByEmail(email)) {
      case (null) { Runtime.trap("Invalid request: Email does not belong to any member") };
      case (?_) {};
    };

    payments.values().toArray().filter(func(p) { p.email == email });
  };

  public query ({ caller }) func getPaymentsByPhone(phone : Text) : async [Payment] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can look up payments by phone");
    };

    let member = switch (getMemberByPhone(phone)) {
      case (null) { Runtime.trap("Invalid request: Phone number does not belong to any member") };
      case (?m) { m };
    };

    payments.values().toArray().filter(func(p) { p.email == member.email });
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all payments");
    };
    payments.values().toArray();
  };

  public shared ({ caller }) func addExpense(expense : Expense) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add expenses");
    };
    expenses.add(expense.id, expense);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view expenses");
    };
    expenses.values().toArray();
  };

  public shared ({ caller }) func addClassBooking(booking : ClassBooking) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add class bookings");
    };

    if (booking.memberId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only book classes for yourself");
    };

    for ((_, member) in members.entries()) {
      if (member.principal == booking.memberId) {
        switch (member.membershipStatus) {
          case (#active) {};
          case (#pending) { Runtime.trap("Cannot book classes: Membership is pending approval") };
          case (#expired) { Runtime.trap("Cannot book classes: Membership has expired") };
        };
      };
    };

    classBookings.add(booking.id, booking);
  };

  public shared ({ caller }) func updateClassBooking(id : Text, booking : ClassBooking) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update bookings");
    };

    let existingBooking = switch (classBookings.get(id)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };

    if (existingBooking.memberId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own bookings");
    };

    classBookings.add(id, booking);
  };

  public query ({ caller }) func getMemberClassBookings() : async [ClassBooking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view class bookings");
    };

    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        return classBookings.values().toArray().filter(func(b) { b.memberId == caller });
      };
    };
    Runtime.trap("Only registered members can view bookings");
  };

  public query ({ caller }) func getClassBookingsByStatus(status : BookingStatus) : async [ClassBooking] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view bookings by status");
    };
    classBookings.values().toArray().filter(func(b) { b.status == status });
  };

  public shared ({ caller }) func addAttendance(record : AttendanceRecord) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add attendance records");
    };
    var foundMemberId : ?Nat = null;
    for ((memberId, member) in members.entries()) {
      if (member.principal == record.memberId) { foundMemberId := ?memberId };
    };
    switch (foundMemberId) {
      case (null) { Runtime.trap("Member not found") };
      case (?memberId) {
        let existing = switch (attendance.get(memberId)) {
          case (null) { [] };
          case (?existing) { existing };
        };
        attendance.add(memberId, existing.concat([record]));
      };
    };
  };

  public query ({ caller }) func getMemberAttendance() : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };

    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        switch (attendance.get(member.id)) {
          case (null) { return [] };
          case (?records) { return records };
        };
      };
    };
    Runtime.trap("Only registered members can view attendance");
  };

  public query ({ caller }) func getAttendanceByMember(memberId : Principal) : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view attendance");
    };

    var targetMemberId : ?Nat = null;
    for ((id, member) in members.entries()) {
      if (member.principal == memberId) {
        targetMemberId := ?id;
      };
    };

    let memberIdValue = switch (targetMemberId) {
      case (null) { Runtime.trap("Member not found") };
      case (?id) { id };
    };

    if (caller == memberId) {
      switch (attendance.get(memberIdValue)) {
        case (null) { return [] };
        case (?records) { return records };
      };
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own attendance or must be admin");
    };

    switch (attendance.get(memberIdValue)) {
      case (null) { return [] };
      case (?records) { return records };
    };
  };

  public query ({ caller }) func getAttendanceByMemberStatus(memberStatus : MembershipStatus) : async [AttendanceRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view attendance by status");
    };

    let filteredMembers = members.values().toArray().filter(func(m) { m.membershipStatus == memberStatus });
    var resultList : [AttendanceRecord] = [];

    for (member in filteredMembers.values()) {
      switch (attendance.get(member.id)) {
        case (null) {};
        case (?records) { resultList := resultList.concat(records) };
      };
    };
    resultList;
  };

  public query ({ caller }) func getMemberProfile() : async ?MemberProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view member profiles");
    };
    for ((_, member) in members.entries()) {
      if (member.principal == caller) { return ?member };
    };
    null;
  };

  public shared ({ caller }) func updateMemberProfile(profile : MemberProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let existingMember = switch (members.get(profile.id)) {
      case (null) { Runtime.trap("Member not found") };
      case (?m) { m };
    };

    if (existingMember.principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update your own profile");
    };

    if (not AccessControl.isAdmin(accessControlState, caller)) {
      // Members cannot change their email if it would conflict with credentials
      if (profile.email != existingMember.email) {
        Runtime.trap("Unauthorized: Members cannot change their email address");
      };

      let restrictedProfile = {
        id = existingMember.id;
        principal = existingMember.principal;
        name = profile.name;
        email = existingMember.email;
        phone = profile.phone;
        membershipStatus = existingMember.membershipStatus;
        startDate = existingMember.startDate;
        endDate = existingMember.endDate;
        workoutPlan = existingMember.workoutPlan;
        dietPlan = existingMember.dietPlan;
        membershipPlan = existingMember.membershipPlan;
        profilePic = profile.profilePic;
      };
      members.add(profile.id, restrictedProfile);
    } else {
      if (profile.email != existingMember.email) {
        if (memberCredentials.get(profile.email) != null) {
          Runtime.trap("Invalid profile update: Email already exists in credentials");
        };

        for ((otherId, otherMember) in members.entries()) {
          if (otherId != profile.id and otherMember.email == profile.email) {
            Runtime.trap("Invalid profile update: Email already in use by another member");
          };
        };
      };

      members.add(profile.id, profile);
    };
  };

  public shared ({ caller }) func checkIn() : async AttendanceRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check in");
    };

    var foundMemberId : ?Nat = null;
    for ((memberId, member) in members.entries()) {
      if (member.principal == caller) {
        switch (member.membershipStatus) {
          case (#active) { foundMemberId := ?memberId };
          case (#pending) { Runtime.trap("Cannot check in: Membership is pending approval") };
          case (#expired) { Runtime.trap("Cannot check in: Membership has expired") };
        };
      };
    };

    switch (foundMemberId) {
      case (null) { Runtime.trap("Member not found") };
      case (?memberId) {
        let record : AttendanceRecord = {
          memberId = caller;
          checkInTime = Time.now();
          checkOutTime = null;
        };
        let existing = switch (attendance.get(memberId)) {
          case (null) { [] };
          case (?existing) { existing };
        };
        attendance.add(memberId, existing.concat([record]));
        record;
      };
    };
  };

  public shared ({ caller }) func checkOut() : async AttendanceRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check out");
    };

    for ((memberId, member) in members.entries()) {
      if (member.principal == caller) {
        let existing = switch (attendance.get(memberId)) {
          case (null) { Runtime.trap("No attendance record found for user") };
          case (?existing) { existing };
        };

        if (existing.size() == 0) {
          Runtime.trap("No attendance record found for user");
        };

        var latest = existing[0];
        for (record in existing.values()) {
          if (record.checkInTime > latest.checkInTime) {
            latest := record;
          };
        };

        let updatedRecord : AttendanceRecord = {
          memberId = latest.memberId;
          checkInTime = latest.checkInTime;
          checkOutTime = ?Time.now();
        };

        let updatedArray = existing.map(
          func(record) {
            if (
              record.memberId == latest.memberId and
              record.checkInTime == latest.checkInTime
            ) { 
              updatedRecord 
            } else { 
              record 
            };
          }
        );

        attendance.add(memberId, updatedArray);
        return updatedRecord;
      };
    };

    Runtime.trap("Only registered members can check out");
  };

  public shared ({ caller }) func generateQrCode(memberId : Nat) : async Text {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can generate QR codes");
    };
    switch (members.get(memberId)) {
      case (null) { Runtime.trap("Member not found") };
      case (?_) {};
    };
    let qr : Text = "QR_" # generateId();
    qrCodes.add(memberId, qr);
    qr;
  };

  public query ({ caller }) func getMyQrCode() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view QR codes");
    };
    for ((memberId, member) in members.entries()) {
      if (member.principal == caller) {
        return qrCodes.get(memberId);
      };
    };
    Runtime.trap("Only registered members can view QR codes");
  };

  public shared ({ caller }) func validateQrCode(qr : Text) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can validate QR codes");
    };

    let filteredMembers = members.values().toArray().filter(
      func(m) { m.membershipStatus == #active }
    );

    for (member in filteredMembers.values()) {
      switch (qrCodes.get(member.id)) {
        case (?existingQr) {
          if (existingQr == qr) {
            return member.id;
          };
        };
        case (null) {};
      };
    };

    Runtime.trap("Invalid QR code");
  };

  // Public query - no authorization needed for checking configuration status
  // This is intentionally public to allow frontend to check before attempting operations
  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  func getStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { config };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfig := ?config;
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check session status");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { await Stripe.getSessionStatus(config, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(
    items : [Stripe.ShoppingItem],
    successUrl : Text,
    cancelUrl : Text
  ) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };

    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        switch (member.membershipStatus) {
          case (#active) {};
          case (#pending) { Runtime.trap("Cannot create checkout session: Membership is pending approval") };
          case (#expired) { Runtime.trap("Cannot create checkout session: Membership has expired") };
        };
      };
    };

    await Stripe.createCheckoutSession(getStripeConfig(), caller, items, successUrl, cancelUrl, transform);
  };

  // Public query - required for HTTP outcall transformation
  // This must remain public for the IC HTTP outcall system to work
  public query func transform(
    input : OutCall.TransformationInput
  ) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query ({ caller }) func getReports() : async ReportSummary {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view reports");
    };

    let now = Time.now();
    let oneMonthMillis = 30 * 24 * 60 * 60 * 1000000000;
    let weekMillis = 7 * 24 * 60 * 60 * 1000000000;

    let monthlyPayments = payments.values().toArray().filter(
      func(p) { p.timestamp > (now - oneMonthMillis) }
    );

    let totalPayments = payments.values().toArray().foldLeft(
      0,
      func(acc, p) { acc + p.amount },
    );

    let monthlyRevenue = monthlyPayments.foldLeft(
      0,
      func(acc, p) { acc + p.amount },
    );

    let totalExpenses = expenses.values().toArray().foldLeft(
      0,
      func(acc, e) { acc + e.amount },
    );

    let profit = totalPayments - totalExpenses;

    let reportMembers : [ReportMember] = members.values().toArray().map(
      func(m) {
        // Match payments by email to handle email-based payment recording
        let paymentsArray = payments.values().toArray().filter(
          func(p) { p.memberId == m.principal or p.email == m.email }
        );
        let totalPaid = paymentsArray.foldLeft(
          0,
          func(acc, p) { acc + p.amount },
        );

        let currentPlan = m.membershipPlan;
        let planCost = currentPlan.price : Nat;
        let moneyDue = if (totalPaid >= planCost) { 0 } else {
          planCost - totalPaid
        };

        let isExpiringSoon = m.endDate > now and m.endDate < (now + weekMillis);
        let isExpired = now > m.endDate;

        {
          member = m;
          moneyDue;
          isExpiringSoon;
          isExpired;
        };
      }
    );

    {
      monthlyRevenue;
      totalPayments;
      totalExpenses;
      profit;
      members = reportMembers;
    };
  };

  public shared ({ caller }) func logCommunication(
    to : Text,
    channel : CommunicationChannel,
    content : Text,
    status : CommunicationStatus
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can log communications");
    };

    if (getMemberByEmail(to) == null) {
      Runtime.trap("Invalid communication log: Email does not belong to any member");
    };

    let logKey = to # "_" # (switch (channel) {
      case (#email) { "email" };
      case (#sms) { "sms" };
      case (#whatsapp) { "whatsapp" };
    });

    let logEntry : CommunicationLogEntry = {
      channel;
      content;
      timestamp = Time.now();
      status;
    };
    communicationLogs.add(logKey, logEntry);
  };

  public query ({ caller }) func getCommunicationLogsByEmail(email : Text) : async [CommunicationLogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view communication logs");
    };

    if (getMemberByEmail(email) == null) {
      Runtime.trap("Invalid request: Email does not belong to any member");
    };

    let emailKey = email # "_email";
    let smsKey = email # "_sms";
    let whatsappKey = email # "_whatsapp";

    let filteredLogs = communicationLogs.toArray().filter(
      func((key, _)) {
        key == emailKey or key == smsKey or key == whatsappKey
      }
    );

    filteredLogs.map(func((_, log)) { log });
  };

  public query ({ caller }) func getAllCommunicationLogs() : async [CommunicationLogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all communication logs");
    };
    communicationLogs.values().toArray();
  };

  public shared ({ caller }) func addMemberWithManualCredentials(
    request : ManualCreateMemberRequest
  ) : async ManualCreateMemberResponse {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create members");
    };

    let email = request.credentials.email;
    let password = request.credentials.password;

    if (not isEmailUnique(email)) {
      Runtime.trap("Invalid member creation: Email already exists in the system");
    };

    if (password == "") {
      Runtime.trap("Invalid member creation: Password cannot be empty");
    };

    memberCredentials.add(email, password);

    let dummyPrincipal = Principal.fromText("aaaaa-aa");
    let uniqueId = generateMemberId();

    let startDate = Time.now();
    let monthsInNanos = request.membershipPlan.durationMonths * 30 * 24 * 60 * 60 * 1000000000;
    let endDate = startDate + monthsInNanos;

    let memberProfile : MemberProfile = {
      id = uniqueId;
      principal = dummyPrincipal;
      name = request.name;
      email;
      phone = request.phone;
      membershipStatus = #pending;
      startDate;
      endDate;
      workoutPlan = null;
      dietPlan = null;
      membershipPlan = request.membershipPlan;
      profilePic = request.profilePic;
    };

    members.add(uniqueId, memberProfile);

    minimalMembers.add(uniqueId, { id = uniqueId; name = request.name });

    let emailContent = "Welcome to Prime Fit Gym!\n\nYour login credentials:\nEmail: " # email # "\nPassword: " # password # "\n\nMembership Plan: " # request.membershipPlan.name # "\nDuration: " # request.membershipPlan.durationMonths.toText() # " months\nPrice: ₹" # request.membershipPlan.price.toText();
    let smsContent = "Welcome to Prime Fit Gym! Login: " # email # " | Password: " # password # " | Plan: " # request.membershipPlan.name;
    let whatsappContent = "🏋️ Welcome to Prime Fit Gym!\n\n✅ Your Account Details:\nEmail: " # email # "\nPassword: " # password # "\n\n💪 Membership: " # request.membershipPlan.name # "\n⏰ Duration: " # request.membershipPlan.durationMonths.toText() # " months\n💰 Price: ₹" # request.membershipPlan.price.toText();

    let emailLog : CommunicationLogEntry = {
      channel = #email;
      content = emailContent;
      timestamp = Time.now();
      status = #sent;
    };
    let smsLog : CommunicationLogEntry = {
      channel = #sms;
      content = smsContent;
      timestamp = Time.now();
      status = #sent;
    };
    let whatsappLog : CommunicationLogEntry = {
      channel = #whatsapp;
      content = whatsappContent;
      timestamp = Time.now();
      status = #sent;
    };

    communicationLogs.add(email # "_email", emailLog);
    communicationLogs.add(email # "_sms", smsLog);
    communicationLogs.add(email # "_whatsapp", whatsappLog);

    {
      member = memberProfile;
      credentials = request.credentials;
      communicationLogs = [emailLog, smsLog, whatsappLog];
    };
  };

  func verifyEmail(inputEmail : Text, storedEmail : Text) : Bool {
    inputEmail.trim(#char ' ') == storedEmail.trim(#char ' ');
  };

  func findMemberByEmail(email : Text) : ?MemberProfile {
    switch (members.values().toArray().find(func(m) { verifyEmail(email, m.email) })) {
      case (?member) { ?member };
      case (null) { null };
    };
  };

  func serializePrincipal(principal : Principal) : Text {
    principal.toText();
  };

  public shared ({ caller }) func memberLogin(email : Text, password : Text) : async SerializeMemberProfile {
    // Reject anonymous callers
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous access not allowed for login");
    };

    let trimmedEmail = email.trim(#char ' ');
    let trimmedPassword = password.trim(#char ' ');

    if (trimmedEmail == "") { Runtime.trap("Invalid credentials provided") };

    switch (memberCredentials.get(trimmedEmail)) {
      case (null) { Runtime.trap("Invalid credentials provided") };
      case (?storedPassword) {
        if (storedPassword.trim(#char ' ') != trimmedPassword) {
          Runtime.trap("Invalid credentials provided");
        };
      };
    };

    switch (findMemberByEmail(trimmedEmail)) {
      case (?member) {
        {
          id = member.id.toText();
          principal = serializePrincipal(member.principal);
          name = member.name;
          email = member.email;
          phone = member.phone;
          membershipStatus = member.membershipStatus;
          startDate = member.startDate.toText();
          endDate = member.endDate.toText();
          workoutPlan = member.workoutPlan;
          dietPlan = member.dietPlan;
          membershipPlan = member.membershipPlan;
          profilePic = member.profilePic;
        };
      };
      case (null) { Runtime.trap("Invalid credentials provided") };
    };
  };

  public query ({ caller }) func getMemberNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated members can view notifications");
    };

    var foundMember : ?MemberProfile = null;
    for ((_, member) in members.entries()) {
      if (member.principal == caller) {
        foundMember := ?member;
      };
    };

    switch (foundMember) {
      case (null) { Runtime.trap("Unauthorized: Only registered members can view notifications") };
      case (?memberProfile) { buildMemberNotifications(memberProfile) };
    };
  };

  func buildMemberNotifications(member : MemberProfile) : [Notification] {
    let now = Time.now();
    let weekNanos = 7 * 24 * 60 * 60 * 1000000000;

    var notifications : [Notification] = [];

    if (member.endDate > now and member.endDate < (now + weekNanos)) {
      notifications := notifications.concat([{
        title = "Membership Expiring Soon";
        message = "Your membership will expire soon: " # member.endDate.toText();
        icon = "⚠️";
        color = "#FFD700";
        priority = 2;
        actions = [("Renew Now", "/renew")];
        timestamp = now;
      }]);
    };

    if (now > member.endDate) {
      notifications := notifications.concat([{
        title = "Membership Expired";
        message = "Your membership expired: " # member.endDate.toText();
        icon = "⌛️";
        color = "#FF6347";
        priority = 1;
        actions = [("Renew Now", "/renew")];
        timestamp = now;
      }]);
    };

    // Match payments by email to handle email-based payment recording
    let memberPayments = payments.values().toArray().filter(
      func(p) { p.memberId == member.principal or p.email == member.email }
    );
    let totalPaid = memberPayments.foldLeft(
      0,
      func(acc, p) { acc + p.amount },
    );
    let memberPlanCost = member.membershipPlan.price : Nat;

    if (totalPaid < memberPlanCost) {
      notifications := notifications.concat([{
        title = "Payment Due";
        message = "You have an outstanding payment of ₹" # (memberPlanCost - totalPaid).toText();
        icon = "💰";
        color = "#FF6347";
        priority = 0;
        actions = [("Pay Now", "/pay")];
        timestamp = now;
      }]);
    };

    notifications;
  };
};
