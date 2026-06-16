import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js";
import User from "../models/auth.js";
import Questions from "../models/Questions.js";
import Answers from "../models/Answers.js";

process.env.NODE_ENV = "test";

describe("Stack Overflow Clone Server Integration Tests", () => {
  let userToken;
  let testUser;
  let otherUserToken;
  let otherTestUser;
  let questionId;
  let answerId;

  beforeAll(async () => {
    // Clear test collections
    await User.deleteMany({ email: { $in: ["testuser@example.com", "otheruser@example.com"] } });
    await Questions.deleteMany({ questionTitle: /Test Question/ });
    await Answers.deleteMany({ userAnswered: /Test User/ });
  });

  afterAll(async () => {
    // Clean up test data and close connection
    await User.deleteMany({ email: { $in: ["testuser@example.com", "otheruser@example.com"] } });
    await Questions.deleteMany({ questionTitle: /Test Question/ });
    await Answers.deleteMany({ userAnswered: /Test User/ });
    await mongoose.connection.close();
  });

  describe("POST /user/signup", () => {
    it("should sign up a user and return a token", async () => {
      const res = await request(app)
        .post("/user/signup")
        .send({
          name: "Test User",
          email: "testuser@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.result.email).toBe("testuser@example.com");

      userToken = res.body.token;
      testUser = res.body.result;
    });

    it("should reject duplicate email registration", async () => {
      const res = await request(app)
        .post("/user/signup")
        .send({
          name: "Test User 2",
          email: "testuser@example.com",
          password: "password123",
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /questions/Ask", () => {
    it("should return 401 when trying to ask a question without auth", async () => {
      const res = await request(app)
        .post("/questions/Ask")
        .send({
          questionTitle: "Test Question Title",
          questionBody: "Test Question Body contents",
          questionTags: ["javascript"],
        });

      expect(res.statusCode).toBe(401);
    });

    it("should create a question with valid auth token", async () => {
      const otherRes = await request(app)
        .post("/user/signup")
        .send({
          name: "Other Test User",
          email: "otheruser@example.com",
          password: "password123",
        });
      otherUserToken = otherRes.body.token;
      otherTestUser = otherRes.body.result;

      const res = await request(app)
        .post("/questions/Ask")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          questionTitle: "Test Question Title",
          questionBody: "Test Question Body contents",
          questionTags: ["javascript"],
          userPosted: "Test User",
        });

      expect(res.statusCode).toBe(200);

      const questionsRes = await request(app).get("/questions/get");
      const question = questionsRes.body.data.find(
        (q) => q.questionTitle === "Test Question Title"
      );
      expect(question).toBeDefined();
      questionId = question._id;
    });
  });

  describe("POST /answer/:id/vote", () => {
    beforeEach(async () => {
      const answerRes = await request(app)
        .patch(`/answer/post/${questionId}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          answerBody: "Test Answer Body",
          userAnswered: "Other Test User",
        });
      answerId = answerRes.body._id;
    });

    it("should vote and toggle votes properly", async () => {
      // Upvote
      let voteRes = await request(app)
        .post(`/answer/${answerId}/vote`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ value: "upVote" });

      expect(voteRes.statusCode).toBe(200);
      expect(voteRes.body.data.upVote).toContain(testUser._id);

      // Upvote again should cancel the vote
      voteRes = await request(app)
        .post(`/answer/${answerId}/vote`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ value: "upVote" });

      expect(voteRes.statusCode).toBe(200);
      expect(voteRes.body.data.upVote).not.toContain(testUser._id);
    });
  });

  describe("PATCH /answer/:id/accept", () => {
    it("should return 403 when requester is not the question author", async () => {
      const res = await request(app)
        .patch(`/answer/${answerId}/accept`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should accept the answer when requester is the question author", async () => {
      const res = await request(app)
        .patch(`/answer/${answerId}/accept`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isAccepted).toBe(true);
    });
  });
});
