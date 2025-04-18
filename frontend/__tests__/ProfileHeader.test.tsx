import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { ProfileHeader } from "../src/components/ProfileHeader";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Helper function to create a test component with default props
const createTestComponent = (overrideProps = {}) => {
  const defaultProps = {
    userId: "123",
    firstName: "John",
    lastName: "Doe",
    institution: "Test University",
    bio: "Test bio",
    fieldOfInterest: "Machine Learning,Data Science",
    profilePicture: "/test-image.jpg",
    following: 10,
    followers: 20,
    email: "test@test.com",
    isFollowing: false,
    socials: {
      twitter: "https://twitter.com/test",
      github: "https://github.com/test",
      linkedin: "https://linkedin.com/test",
      website: "https://test.com",
    },
    setResearcher: jest.fn(),
  };

  const props = { ...defaultProps, ...overrideProps };
  return render(<ProfileHeader {...props} />);
};

describe("ProfileHeader Component", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open to prevent actual navigation during tests
    window.open = jest.fn();
    // Mock window.location.reload
    // delete window.location;
    window.alert = jest.fn();
    window.location = { reload: jest.fn() } as any;
  });

  // Rendering Tests
  describe("Rendering", () => {
    test("renders profile information correctly", () => {
      createTestComponent();

      expect(screen.getByText("John Doe")).toBeDefined();
      expect(screen.getByText("Test University")).toBeDefined();
      expect(screen.getByTestId("follower-count-id").innerHTML).toBe("20");
      expect(screen.getByTestId("following-count-id").innerHTML).toBe("10");
    });

    test("renders social links correctly", () => {
      createTestComponent();

      const socialLinks = [
        { icon: "twitter-link" },
        { icon: "github-link" },
        { icon: "linkedin-link" },
        { icon: "website-link" },
      ];

      socialLinks.forEach((social) => {
        expect(screen.getByTestId(social.icon)).toBeDefined();
      });
    });
  });

  // Editing Profile Tests
  describe("Profile Editing", () => {
    test("enters edit mode and updates profile", async () => {
      const setResearcher = jest.fn();
      const { getByText, getByLabelText } = createTestComponent({
        setResearcher,
      });

      // Open edit mode
      fireEvent.click(screen.getByTestId("hamburger-menu-button"));
      fireEvent.click(screen.getByText("Edit Profile"));

      // Update first name
      const firstNameInput = screen.getByLabelText("First name");
      fireEvent.change(firstNameInput, { target: { value: "Jane" } });

      // Mock successful API response
      mockedAxios.put.mockResolvedValue({
        data: { firstName: "Jane" },
      });

      // Save changes
      fireEvent.click(screen.getByText("Save"));

      // Wait for API call and check expectations
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          expect.stringContaining("/123"),
          expect.objectContaining({ firstName: "Jane" }),
        );
        expect(setResearcher).toHaveBeenCalled();
      });
    });

    test("cancels edit mode", () => {
      createTestComponent();

      // Open edit mode
      fireEvent.click(screen.getByTestId("hamburger-menu-button"));
      fireEvent.click(screen.getByText("Edit Profile"));

      // Cancel editing
      fireEvent.click(screen.getByText("Cancel"));

      // Verify back to view mode
      expect(screen.getByText("John Doe")).toBeDefined();
    });
  });

  // Follow Functionality Tests
  describe("Follow Functionality", () => {
    test("toggles follow state", () => {
      const setResearcher = jest.fn();
      createTestComponent({ setResearcher });

      // Click follow button
      const followButton = screen.getByText("Follow");
      fireEvent.click(followButton);

      // Check if follow state updated
      expect(setResearcher).toHaveBeenCalledWith(
        expect.objectContaining({
          followers: 21, // Increased by 1
        }),
      );
    });
  });

  // Profile Deletion Tests
  describe("Profile Deletion", () => {
    test("deletes profile", async () => {
      createTestComponent();

      // Open menu and click delete
      fireEvent.click(screen.getByTestId("hamburger-menu-button"));
      // fireEvent.click(screen.getByRole('button', { name: '' })); // More vertical button
      fireEvent.click(screen.getByText("Delete Profile"));

      // Confirm deletion
      mockedAxios.delete.mockResolvedValue({});
      fireEvent.click(screen.getByText("Delete"));

      // Wait for API call and check expectations
      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining("/123"),
        );
        expect(window.open).toHaveBeenCalledWith("/");
      });
    });
  });

  // Image Upload Tests
  describe("Image Upload", () => {
    test("opens file selector", () => {
      createTestComponent();

      // Hover over profile picture and click
      fireEvent.click(screen.getByTestId("hamburger-menu-button"));
      fireEvent.click(screen.getByText("Edit Profile"));
      fireEvent.click(screen.getByTestId("profile-picture-id"));

      // Check upload popup is visible
      expect(screen.getByText("Update Profile Picture")).toBeDefined();
    });
  });

  // Edge Cases
  describe("Edge Cases", () => {
    test("handles empty bio", () => {
      createTestComponent({ bio: "" });
      expect(screen.getByText("No biography available.")).toBeDefined();
    });

    test("handles missing social links", () => {
      createTestComponent({
        socials: {},
      });

      // Verify no social links are rendered
      const socialIcons = ["Twitter", "Github", "Linkedin", "Globe"];
      socialIcons.forEach((icon) => {
        const link = screen.queryByRole("link", { name: icon });
        expect(link).toBeNull();
      });
    });

    test("handles API errors gracefully", async () => {
      // Mock console.log to prevent error output in test
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      createTestComponent();

      // Simulate API error during profile update
      mockedAxios.put.mockRejectedValue(new Error("API Error"));

      // Open edit mode and try to save
      fireEvent.click(screen.getByTestId("hamburger-menu-button"));
      fireEvent.click(screen.getByText("Edit Profile"));
      fireEvent.click(screen.getByText("Save"));

      // Wait and check error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
});
