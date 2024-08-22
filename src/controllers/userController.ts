import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { usersCollection } from "../config/db"; // Adjust the import path as necessary

// This function is responsible for creating a new user
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return; // Ensure the function exits here
    }
    // insert a new user to the data base
    const result = await usersCollection.insertOne({ name });

    // check if insertion was successfull
    if (!result.acknowledged) {
      res.status(500).json({ message: "Failed to create user" });
      return;
    }

    res.status(201).json({
      message: "User created successfully",
      user: { _id: result.insertedId, name },
    });
  } catch (error) {
    next(error);
  }
};

// This function retrieves a user from the database based on their name.
export const getUserByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // It looks for the user's name in the query parameters of the request
    const { name } = req.query;

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    // It searches for a user in the database collection to check for the name
    const user = await usersCollection.findOne({ name: String(name) });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // It gets the user ID from the URL path
    const { id } = req.params;

    // It checks if the ID is a valid MongoDB ObjectId using ObjectId.isValid(id).
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    // Finds the User
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name: newName } = req.body;
    const { name: oldName } = req.query;

    // Ensure both old name and new name are provided
    if (!oldName || !newName) {
      res.status(400).json({
        message: "Both old name (query) and new name (body) are required",
      });
      return;
    }

    // Attempt to update the user with the old name
    const result = await usersCollection.updateOne(
      { name: String(oldName) }, // Filter by old name
      { $set: { name: newName } } // Set the new name
    );

    // If no document was modified, the user was not found
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Log the received ID and new name
    console.log(`Received ID: ${id}, New Name: ${name}`);
    //It checks if the provided ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    // Verify user existence before update
    const existingUser = await usersCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Perform the update operation
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name } },
      { returnDocument: "after" }
    );

    // Check if result or result.value is null
    if (result === null || result.value === null) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Respond with the updated user information
    res
      .status(200)
      .json({ message: "User updated successfully", user: result.value });
  } catch (error) {
    // Handle any unexpected errors
    next(error);
  }
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if ID is valid
    if (!ObjectId.isValid(id)) {
      2;
      res.status(400).json({ message: "Invalid user ID" });
      return; // Ensure the function stops executing after sending the response
    }

    // Convert the ID to ObjectId
    const objectId = new ObjectId(id);

    // Attempt to delete the user
    const deleteResult = await usersCollection.findOneAndDelete({
      _id: objectId,
    });

    // Handle the possibility that deleteResult might be null or undefined
    if (deleteResult === null || deleteResult.value === null) {
      res.status(404).json({ message: "User not found" });
      return; // Ensure the function stops executing after sending the response
    }

    // Success response
    res
      .status(200)
      .json({ message: "User deleted successfully", user: deleteResult.value });
  } catch (error) {
    next(error);
  }
};

export const deleteUserByName = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Name query parameter is required" });
      return;
    }

    const result = await usersCollection.deleteOne({ name });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
