from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(Exception)
    def generic(e):
        app.logger.exception(e)
        return jsonify({"error": "Internal Server Error"}), 500
