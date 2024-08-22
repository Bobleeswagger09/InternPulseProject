import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import {
  createUser,
  getUserByName,
  getUserById,
  updateUserByName,
  updateUserById,
  deleteUserById,
  deleteUserByName,
} from "../../controllers/userController";
import { usersCollection } from "../../config/db";

// Ensure the usersCollection is mocked properly
jest.mock("../../config/db", () => ({
  usersCollection: {
    insertOne: jest.fn(), // Mock the insertOne method
    findOne: jest.fn(), // Mock the findOne method
    updateOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

describe("createUser", () => {
  it("should create a new user and return 201 status", async () => {
    const req = {
      body: { name: "John Doe" },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    // Log to debug if usersCollection is correctly mocked
    console.log("usersCollection:", usersCollection);

    // Mock the insertOne method
    (usersCollection.insertOne as jest.Mock).mockResolvedValue({
      acknowledged: true,
      insertedId: "some-id",
    });

    await createUser(req, res, next);

    expect(usersCollection.insertOne).toHaveBeenCalledWith({
      name: "John Doe",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User created successfully",
      user: { _id: "some-id", name: "John Doe" },
    });
  });

  it("should return 400 if name is not provided", async () => {
    const req = {
      body: {},
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    await createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Name is required" });
  });
});

describe("getUserByName", () => {
  it("should return the user when a valid name is provided", async () => {
    const req = { query: { name: "John Doe" } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    // Mock the findOne method to return a user
    (usersCollection.findOne as jest.Mock).mockResolvedValue({
      _id: "some-id",
      name: "John Doe",
    });

    await getUserByName(req, res, next);

    expect(usersCollection.findOne).toHaveBeenCalledWith({ name: "John Doe" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      _id: "some-id",
      name: "John Doe",
    });
  });

  it("should return 400 if name is not provided in the query", async () => {
    const req = { query: {} } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    await getUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("should return 404 if the user is not found", async () => {
    const req = { query: { name: "Unknown User" } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    // Mock the findOne method to return null (user not found)
    (usersCollection.findOne as jest.Mock).mockResolvedValue(null);

    await getUserByName(req, res, next);

    expect(usersCollection.findOne).toHaveBeenCalledWith({
      name: "Unknown User",
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("should call next with an error if an exception occurs", async () => {
    const req = { query: { name: "John Doe" } } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    const next = jest.fn();

    // Mock the findOne method to throw an error
    (usersCollection.findOne as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await getUserByName(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("updateUserByName", () => {
  it("should update the user when valid names are provided", async () => {
    const req = {
      body: { name: "New Name" },
      query: { name: "Old Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock updateOne method to simulate a successful update
    (usersCollection.updateOne as jest.Mock).mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    await updateUserByName(req, res, next);

    expect(usersCollection.updateOne).toHaveBeenCalledWith(
      { name: "Old Name" }, // Filter by old name
      { $set: { name: "New Name" } } // Set the new name
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User updated successfully",
    });
  });

  it("should return 400 if either the old name or new name is missing", async () => {
    const req = {
      body: { name: "New Name" },
      query: {}, // Missing old name
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await updateUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Both old name (query) and new name (body) are required",
    });
  });

  it("should return 404 if the user is not found", async () => {
    const req = {
      body: { name: "New Name" },
      query: { name: "Old Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock updateOne method to simulate no documents matched
    (usersCollection.updateOne as jest.Mock).mockResolvedValue({
      matchedCount: 0,
      modifiedCount: 0,
    });

    await updateUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found",
    });
  });

  it("should call next with an error if an exception occurs", async () => {
    const req = {
      body: { name: "New Name" },
      query: { name: "Old Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock updateOne method to throw an error
    (usersCollection.updateOne as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await updateUserByName(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("updateUserById", () => {
  const mockFindOne = usersCollection.findOne as jest.Mock;
  const mockFindOneAndUpdate = usersCollection.findOneAndUpdate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks
  });


  it("should update the user when a valid ID and name are provided", async () => {
    const req = {
      params: { id: "valid-id" },
      body: { name: "New Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the findOne method to return an existing user
    mockFindOne.mockResolvedValue({
      _id: new ObjectId("valid-id"),
      name: "Old Name",
    });

    // Mock the findOneAndUpdate method to return the updated user
    mockFindOneAndUpdate.mockResolvedValue({
      value: { _id: new ObjectId("valid-id"), name: "New Name" },
    });

    await updateUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User updated successfully",
      user: { _id: new ObjectId("valid-id"), name: "New Name" },
    });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should return 400 if the ID is invalid", async () => {
    const req = {
      params: { id: "invalid-id" },
      body: { name: "New Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await updateUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should return 404 if the user is not found", async () => {
    const req = {
      params: { id: "valid-id" },
      body: { name: "New Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the findOne method to return null
    mockFindOne.mockResolvedValue(null);

    await updateUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should call next with an error if an exception occurs", async () => {
    const req = {
      params: { id: "valid-id" },
      body: { name: "New Name" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the findOne method to throw an error
    mockFindOne.mockRejectedValue(new Error("Database error"));

    await updateUserById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).toHaveBeenCalledWith(new Error("Database error")); // Optional check for specific error message
  });
});
describe("deleteUserById", () => {
  it("should delete the user when a valid ID is provided", async () => {
    const req = {
      params: { id: "60d5f4813d4f3f2d4c9b53e7" },
    } as unknown as Request; // Use a valid ObjectId
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    (usersCollection.findOneAndDelete as jest.Mock).mockResolvedValue({
      value: {
        _id: new ObjectId("60d5f4813d4f3f2d4c9b53e7"),
        name: "User Name",
      },
    });

    await deleteUserById(req, res, next);

    expect(usersCollection.findOneAndDelete).toHaveBeenCalledWith({
      _id: new ObjectId("60d5f4813d4f3f2d4c9b53e7"),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
      user: {
        _id: new ObjectId("60d5f4813d4f3f2d4c9b53e7"),
        name: "User Name",
      },
    });
  });

  it("should return 400 if the ID is invalid", async () => {
    const req = {
      params: { id: "invalid-id" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await deleteUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
  });

  it("should return 404 if the user is not found", async () => {
    const req = {
      params: { id: "60d5f4813d4f3f2d4c9b53e7" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    (usersCollection.findOneAndDelete as jest.Mock).mockResolvedValue({
      value: null,
    });

    await deleteUserById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("should call next with an error if an exception occurs", async () => {
    const req = {
      params: { id: "60d5f4813d4f3f2d4c9b53e7" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the method to reject with an error
    (usersCollection.findOneAndDelete as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await deleteUserById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
describe("deleteUserByName", () => {
  it("should delete the user when a valid name is provided", async () => {
    const req = { query: { name: "John Doe" } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the deleteOne method to return a result with deletedCount > 0
    (usersCollection.deleteOne as jest.Mock).mockResolvedValue({
      deletedCount: 1,
    });

    await deleteUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User deleted successfully",
    });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should return 400 if the name query parameter is missing", async () => {
    const req = { query: {} } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    await deleteUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Name query parameter is required",
    });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should return 404 if the user is not found", async () => {
    const req = { query: { name: "John Doe" } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the deleteOne method to return a result with deletedCount === 0
    (usersCollection.deleteOne as jest.Mock).mockResolvedValue({
      deletedCount: 0,
    });

    await deleteUserByName(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(next).not.toHaveBeenCalled(); // Ensure next is not called
  });

  it("should call next with an error if an exception occurs", async () => {
    const req = { query: { name: "John Doe" } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    // Mock the deleteOne method to reject with an error
    (usersCollection.deleteOne as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await deleteUserByName(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next).toHaveBeenCalledWith(new Error("Database error")); // Optional check for specific error message
  });
});
