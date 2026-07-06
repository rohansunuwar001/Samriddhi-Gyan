/**
 * Self-contained JavaScript Parser and AST Generator for code logic verification.
 * Supports basic variables, for-loops, while-loops, function calls, and assignments.
 */

class Tokenizer {
  constructor(code) {
    this.code = code;
    this.pos = 0;
  }

  tokenize() {
    const tokens = [];
    const keywords = new Set(["const", "let", "var", "for", "while", "function", "if", "else", "return"]);
    
    while (this.pos < this.code.length) {
      const char = this.code[this.pos];

      // Skip whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // Single characters symbols
      if (["(", ")", "{", "}", ";", ",", "=", "+", "-", "*", "/", "<", ">", "!"].includes(char)) {
        // Multi-character comparison support (e.g. <=, >=, ++, +=)
        const nextChar = this.code[this.pos + 1];
        if ((char === "<" || char === ">" || char === "=" || char === "!") && nextChar === "=") {
          tokens.push({ type: "Operator", value: char + "=" });
          this.pos += 2;
        } else if (char === "+" && nextChar === "+") {
          tokens.push({ type: "Operator", value: "++" });
          this.pos += 2;
        } else if (char === "-" && nextChar === "-") {
          tokens.push({ type: "Operator", value: "--" });
          this.pos += 2;
        } else {
          tokens.push({ type: "Symbol", value: char });
          this.pos++;
        }
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        let val = "";
        while (this.pos < this.code.length && /\d/.test(this.code[this.pos])) {
          val += this.code[this.pos];
          this.pos++;
        }
        tokens.push({ type: "Number", value: Number(val) });
        continue;
      }

      // Identifiers / Keywords
      if (/[a-zA-Z_$]/.test(char)) {
        let val = "";
        while (this.pos < this.code.length && /[a-zA-Z0-9_$]/.test(this.code[this.pos])) {
          val += this.code[this.pos];
          this.pos++;
        }
        if (keywords.has(val)) {
          tokens.push({ type: "Keyword", value: val });
        } else {
          tokens.push({ type: "Identifier", value: val });
        }
        continue;
      }

      // String Literals
      if (char === '"' || char === "'") {
        const quoteType = char;
        let val = "";
        this.pos++; // Skip opening quote
        while (this.pos < this.code.length && this.code[this.pos] !== quoteType) {
          val += this.code[this.pos];
          this.pos++;
        }
        this.pos++; // Skip closing quote
        tokens.push({ type: "String", value: val });
        continue;
      }

      // Ignore comments or unknown chars
      this.pos++;
    }
    return tokens;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.idx = 0;
  }

  peek() {
    return this.tokens[this.idx] || null;
  }

  next() {
    return this.tokens[this.idx++] || null;
  }

  parse() {
    const body = [];
    while (this.idx < this.tokens.length) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    return { type: "Program", body };
  }

  parseStatement() {
    const token = this.peek();
    if (!token) return null;

    if (token.type === "Keyword") {
      switch (token.value) {
        case "const":
        case "let":
        case "var":
          return this.parseVariableDeclaration();
        case "for":
          return this.parseForStatement();
        case "while":
          return this.parseWhileStatement();
        case "function":
          return this.parseFunctionDeclaration();
        default:
          this.next(); // Skip unhandled keyword
          return null;
      }
    }

    // Default: expression/assignment/function call
    return this.parseExpressionStatement();
  }

  parseVariableDeclaration() {
    const kind = this.next().value; // const/let/var
    const nameToken = this.next();
    if (!nameToken || nameToken.type !== "Identifier") return null;

    let init = null;
    if (this.peek()?.value === "=") {
      this.next(); // skip '='
      init = this.parseExpression();
    }

    if (this.peek()?.value === ";") {
      this.next(); // skip ';'
    }

    return {
      type: "VariableDeclaration",
      kind,
      id: nameToken.value,
      init
    };
  }

  parseForStatement() {
    this.next(); // skip 'for'
    if (this.peek()?.value === "(") this.next(); // skip '('

    const init = this.parseStatement(); // loop variable init
    const test = this.parseExpression(); // condition
    if (this.peek()?.value === ";") this.next();
    const update = this.parseExpression(); // increment
    
    if (this.peek()?.value === ")") this.next();
    const body = this.parseBlockStatement();

    return {
      type: "ForStatement",
      init,
      test,
      update,
      body
    };
  }

  parseWhileStatement() {
    this.next(); // skip 'while'
    if (this.peek()?.value === "(") this.next();
    const test = this.parseExpression();
    if (this.peek()?.value === ")") this.next();
    const body = this.parseBlockStatement();

    return {
      type: "WhileStatement",
      test,
      body
    };
  }

  parseFunctionDeclaration() {
    this.next(); // skip 'function'
    const nameToken = this.next();
    if (!nameToken || nameToken.type !== "Identifier") return null;

    if (this.peek()?.value === "(") this.next();
    const params = [];
    while (this.peek() && this.peek().value !== ")") {
      const p = this.next();
      if (p.type === "Identifier") params.push(p.value);
      if (this.peek()?.value === ",") this.next();
    }
    if (this.peek()?.value === ")") this.next();
    const body = this.parseBlockStatement();

    return {
      type: "FunctionDeclaration",
      id: nameToken.value,
      params,
      body
    };
  }

  parseBlockStatement() {
    if (this.peek()?.value === "{") this.next(); // skip '{'
    const body = [];
    while (this.peek() && this.peek().value !== "}") {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
    if (this.peek()?.value === "}") this.next(); // skip '}'
    return { type: "BlockStatement", body };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    if (this.peek()?.value === ";") this.next();
    return expr;
  }

  parseExpression() {
    const token = this.next();
    if (!token) return null;

    // Direct identifier or value
    if (token.type === "Identifier") {
      // Check if it's a function call (e.g. print(x))
      if (this.peek()?.value === "(") {
        this.next(); // skip '('
        const args = [];
        while (this.peek() && this.peek().value !== ")") {
          args.push(this.parseExpression());
          if (this.peek()?.value === ",") this.next();
        }
        if (this.peek()?.value === ")") this.next();
        return { type: "CallExpression", callee: token.value, arguments: args };
      }
      return { type: "Identifier", name: token.value };
    }

    if (token.type === "Number" || token.type === "String") {
      return { type: "Literal", value: token.value };
    }

    return null;
  }
}

/**
 * Parses raw code into an Abstract Syntax Tree (AST).
 * @param {string} code - The Javascript code block.
 * @returns {Object} AST node tree.
 */
export function parseCodeToAST(code) {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Validates a student's AST tree against required structural nodes.
 * @param {Object} ast - AST tree.
 * @param {Array<string>} requiredNodes - List of required node types (e.g. 'ForStatement', 'CallExpression').
 * @returns {boolean} True if all required structures are matched.
 */
export function validateAST(ast, requiredNodes = []) {
  if (!ast || !ast.body) return false;

  const foundSet = new Set();
  const traverse = (node) => {
    if (!node) return;
    if (node.type) foundSet.add(node.type);

    // Recurse down any potential array/object children properties
    Object.keys(node).forEach((key) => {
      const child = node[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          child.forEach(traverse);
        } else {
          traverse(child);
        }
      }
    });
  };

  traverse(ast);

  return requiredNodes.every(nodeType => foundSet.has(nodeType));
}
