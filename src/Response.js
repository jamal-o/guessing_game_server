class Response {
	constructor(message, options = {}) {
		this.message = message;
		this.success = options.success || true;
		this.data = options.data;
	}

	valueOf() {
		return {
			message: this.message,
			success: this.success,
			data: this.data,
		};
	}
}
exports.Response = Response;
