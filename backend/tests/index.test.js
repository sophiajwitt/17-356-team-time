const fs = require("fs");

jest.mock("fs");
jest.spyOn(process.stdout, "write").mockImplementation(() => {});

describe("Logging functionality", () => {
  let logFileWriteMock;

  beforeAll(() => {
    logFileWriteMock = jest.fn();
    fs.createWriteStream.mockReturnValue({
      write: logFileWriteMock,
    });
    require("../index"); // Ensure the logging setup code runs
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
