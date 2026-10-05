/**
 * CloudDeploy — ESLint Flat Configuration
 */

module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                console: "readonly",
                process: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                __dirname: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Buffer: "readonly",
                fetch: "readonly",
                window: "readonly",
                document: "readonly",
                localStorage: "readonly",
                io: "readonly",
                performance: "readonly",
                lucide: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": "off"
        }
    }
];
