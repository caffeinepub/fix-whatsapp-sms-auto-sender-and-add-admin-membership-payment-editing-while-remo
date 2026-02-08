import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface SerializeMemberProfile {
    id: string;
    principal: string;
    endDate: string;
    name: string;
    email: string;
    membershipStatus: MembershipStatus;
    phone: string;
    dietPlan?: DietPlan;
    membershipPlan: MembershipPlan;
    profilePic?: ExternalBlob;
    workoutPlan?: WorkoutPlan;
    startDate: string;
}
export interface CreateMemberRequest {
    name: string;
    phone: string;
    membershipPlan: MembershipPlan;
    profilePic?: ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface RegisteredMemberInfo {
    id: Principal;
    name: string;
    email: string;
    phone: string;
}
export interface Credentials {
    password: string;
    email: string;
}
export interface ManualCreateMemberResponse {
    member: MemberProfile;
    credentials: Credentials;
    communicationLogs: Array<CommunicationLogEntry>;
}
export interface MemberProfile {
    id: bigint;
    principal: Principal;
    endDate: Time;
    name: string;
    email: string;
    membershipStatus: MembershipStatus;
    phone: string;
    dietPlan?: DietPlan;
    membershipPlan: MembershipPlan;
    profilePic?: ExternalBlob;
    workoutPlan?: WorkoutPlan;
    startDate: Time;
}
export interface CommunicationLogEntry {
    status: CommunicationStatus;
    content: string;
    timestamp: Time;
    channel: CommunicationChannel;
}
export interface WorkoutPlan {
    id: string;
    name: string;
    exercises: Array<Exercise>;
    description: string;
    durationWeeks: bigint;
}
export interface ReportMember {
    member: MemberProfile;
    isExpired: boolean;
    moneyDue: bigint;
    isExpiringSoon: boolean;
}
export interface DietPlan {
    id: string;
    meals: Array<Meal>;
    fatG: bigint;
    calories: bigint;
    name: string;
    description: string;
    carbsG: bigint;
    proteinG: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface MinimalMember {
    id: bigint;
    name: string;
}
export interface AttendanceRecord {
    memberId: Principal;
    checkInTime: Time;
    checkOutTime?: Time;
}
export interface ManualCreateMemberRequest {
    name: string;
    credentials: Credentials;
    phone: string;
    membershipPlan: MembershipPlan;
    profilePic?: ExternalBlob;
}
export interface Meal {
    fatG: bigint;
    calories: bigint;
    name: string;
    description: string;
    carbsG: bigint;
    proteinG: bigint;
}
export interface Exercise {
    name: string;
    reps: bigint;
    sets: bigint;
    weightKg: bigint;
}
export interface CreateMemberResponse {
    member: MemberProfile;
    credentials: MemberCredentials;
    communicationLogs: Array<CommunicationLogEntry>;
}
export interface Payment {
    id: string;
    status: PaymentStatus;
    memberId: Principal;
    timestamp: Time;
    amount: bigint;
}
export interface Expense {
    id: string;
    type: ExpenseType;
    description: string;
    timestamp: Time;
    amount: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ReportSummary {
    members: Array<ReportMember>;
    totalPayments: bigint;
    totalExpenses: bigint;
    profit: bigint;
    monthlyRevenue: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface MemberCredentials {
    password: string;
    email: string;
}
export interface Notification {
    title: string;
    icon: string;
    color: string;
    actions: Array<[string, string]>;
    message: string;
    timestamp: Time;
    priority: bigint;
}
export interface MembershipPlan {
    id: string;
    name: string;
    durationMonths: bigint;
    benefits: string;
    price: bigint;
}
export interface ClassBooking {
    id: string;
    status: BookingStatus;
    memberId: Principal;
    date: Time;
    classType: ClassType;
}
export interface UserProfile {
    id: Principal;
    name: string;
    role: AppRole;
    email: string;
    profilePic?: ExternalBlob;
}
export enum AppRole {
    Member = "Member",
    Admin = "Admin"
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum BookingStatus {
    cancelled = "cancelled",
    completed = "completed",
    booked = "booked"
}
export enum ClassType {
    yoga = "yoga",
    crossfit = "crossfit",
    zumba = "zumba",
    pilates = "pilates"
}
export enum CommunicationChannel {
    sms = "sms",
    whatsapp = "whatsapp",
    email = "email"
}
export enum CommunicationStatus {
    pending = "pending",
    sent = "sent",
    failed = "failed"
}
export enum ExpenseType {
    other = "other",
    equipment = "equipment",
    rent = "rent",
    utilities = "utilities"
}
export enum MembershipStatus {
    active = "active",
    expired = "expired",
    pending = "pending"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAttendance(record: AttendanceRecord): Promise<void>;
    addClassBooking(booking: ClassBooking): Promise<void>;
    addExpense(expense: Expense): Promise<void>;
    addMember(name: string): Promise<bigint>;
    addMemberWithManualCredentials(request: ManualCreateMemberRequest): Promise<ManualCreateMemberResponse>;
    addMembershipPlan(plan: MembershipPlan): Promise<void>;
    addPayment(payment: Payment): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: UserRole): Promise<void>;
    checkIn(): Promise<AttendanceRecord>;
    checkOut(): Promise<AttendanceRecord>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createMemberWithCredentials(arg0: CreateMemberRequest): Promise<CreateMemberResponse>;
    deleteMember(id: bigint): Promise<void>;
    deleteMembershipPlan(id: string): Promise<void>;
    generateQrCode(memberId: bigint): Promise<string>;
    getAllCommunicationLogs(): Promise<Array<CommunicationLogEntry>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllMembers(): Promise<Array<MemberProfile>>;
    getAllMembershipPlans(): Promise<Array<MembershipPlan>>;
    getAllMinimalMembers(): Promise<Array<MinimalMember>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAttendanceByMember(memberId: Principal): Promise<Array<AttendanceRecord>>;
    getAttendanceByMemberStatus(memberStatus: MembershipStatus): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClassBookingsByStatus(status: BookingStatus): Promise<Array<ClassBooking>>;
    getCommunicationLogsByEmail(email: string): Promise<Array<CommunicationLogEntry>>;
    getMember(id: bigint): Promise<MemberProfile>;
    getMemberAttendance(): Promise<Array<AttendanceRecord>>;
    getMemberClassBookings(): Promise<Array<ClassBooking>>;
    getMemberNotifications(): Promise<Array<Notification>>;
    getMemberPayments(): Promise<Array<Payment>>;
    getMemberProfile(): Promise<MemberProfile | null>;
    getMembershipPlan(id: string): Promise<MembershipPlan>;
    getMyQrCode(): Promise<string | null>;
    getPayment(id: string): Promise<Payment>;
    getRegisteredMembers(): Promise<Array<RegisteredMemberInfo>>;
    getReports(): Promise<ReportSummary>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRole(target: Principal): Promise<UserRole>;
    isAdminRegistered(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    logCommunication(to: string, channel: CommunicationChannel, content: string, status: CommunicationStatus): Promise<void>;
    memberLogin(email: string, password: string): Promise<SerializeMemberProfile>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateClassBooking(id: string, booking: ClassBooking): Promise<void>;
    updateMember(id: bigint, member: MemberProfile): Promise<void>;
    updateMemberDietPlan(memberId: bigint, plan: DietPlan): Promise<void>;
    updateMemberProfile(profile: MemberProfile): Promise<void>;
    updateMemberWorkoutPlan(memberId: bigint, plan: WorkoutPlan): Promise<void>;
    updateMembershipPlan(plan: MembershipPlan): Promise<void>;
    validateQrCode(qr: string): Promise<bigint>;
}
