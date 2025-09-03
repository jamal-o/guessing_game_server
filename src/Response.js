class Response {
	constructor(message, options = {}) {
		this.message = message;
		this.success = options.success || true;
		this.data = options.data;
	}

	valueOf() {
		return {
			message,
			success,
			data,
		};
	}
}
exports.Response = Response;
