// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios (ESM in node_modules can trip up Jest without custom transforms)
jest.mock('axios', () => {
	const mockInstance = {
		interceptors: {
			request: { use: jest.fn() },
			response: { use: jest.fn() },
		},
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
	};

	const axios = {
		create: jest.fn(() => mockInstance),
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
	};
	// allow default import semantics
	axios.default = axios;

	return axios;
});