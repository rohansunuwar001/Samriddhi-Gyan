/**
 * Self-contained Multilingual Parser and AST Generator for code logic verification.
 * Supports JavaScript, Python, Java, C++, Go, and Ruby code parsing to a unified AST representation.
 */

class Tokenizer {
  constructor(code, language = "javascript") {
    this.code = code;
    this.pos = 0;
    this.language = language;
  }

  tokenize() {
    const tokens = [];
    let keywords = new Set(["const", "let", "var", "for", "while", "function", "if", "else", "return"]);
    if (this.language === "python") {
      keywords = new Set(["def", "for", "while", "if", "else", "elif", "return", "in", "import"]);
    } else if (this.language === "go") {
      keywords = new Set(["func", "var", "for", "if", "else", "return", "package", "import"]);
    } else if (this.language === "ruby") {
      keywords = new Set(["def", "for", "while", "if", "else", "return", "end", "each", "do"]);
    } else if (this.language === "php") {
      keywords = new Set(["echo", "for", "while", "function", "if", "else", "return", "php"]);
    } else if (this.language === "cobol") {
      keywords = new Set([
        "DISPLAY", "EVALUATE", "WHEN", "END-EVALUATE", "PERFORM", "UNTIL", "IDENTIFICATION", "PROGRAM-ID", 
        "PROCEDURE", "DIVISION", "STOP", "RUN", "display", "evaluate", "when", "end-evaluate", "perform", 
        "until", "identification", "program-id", "procedure", "division", "stop", "run"
      ]);
    } else if (this.language === "sql") {
      keywords = new Set(["SELECT", "FROM", "WHERE", "ORDER", "BY", "DESC", "ASC", "select", "from", "where", "order", "by"]);
    } else if (this.language === "html") {
      keywords = new Set(["DOCTYPE", "html", "head", "title", "body", "h1", "div", "p", "a"]);
    } else if (["cpp", "java", "c"].includes(this.language)) {
      keywords = new Set(["int", "double", "float", "char", "String", "void", "for", "while", "if", "else", "return", "public", "private", "class", "std", "string"]);
    }
    
    while (this.pos < this.code.length) {
      // Skip PHP tags
      if (this.code.slice(this.pos, this.pos + 5) === "<?php") {
        this.pos += 5;
        continue;
      }
      if (this.code.slice(this.pos, this.pos + 2) === "<?") {
        this.pos += 2;
        continue;
      }
      if (this.code.slice(this.pos, this.pos + 2) === "?>") {
        this.pos += 2;
        continue;
      }

      const char = this.code[this.pos];

      // Skip whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // Skip HTML comments (<!-- -->)
      if (this.code.slice(this.pos, this.pos + 4) === "<!--") {
        this.pos += 4;
        while (this.pos < this.code.length && this.code.slice(this.pos, this.pos + 3) !== "-->") {
          this.pos++;
        }
        this.pos += 3;
        continue;
      }

      // Skip single line comment (//, #, or --)
      if (char === "#" || (char === "/" && this.code[this.pos + 1] === "/") || (char === "-" && this.code[this.pos + 1] === "-")) {
        while (this.pos < this.code.length && this.code[this.pos] !== "\n") {
          this.pos++;
        }
        continue;
      }

      // Skip multi-line comment (/* */)
      if (char === "/" && this.code[this.pos + 1] === "*") {
        this.pos += 2;
        while (this.pos < this.code.length && !(this.code[this.pos] === "*" && this.code[this.pos + 1] === "/")) {
          this.pos++;
        }
        this.pos += 2;
        continue;
      }

      // Single characters symbols
      if (["(", ")", "{", "}", ";", ",", "=", "+", "-", "*", "/", "<", ">", "!", "."].includes(char)) {
        // Multi-character comparison support (e.g. <=, >=, ++, +=, :=)
        const nextChar = this.code[this.pos + 1];
        if (char === ":" && nextChar === "=") {
          tokens.push({ type: "Operator", value: ":=" });
          this.pos += 2;
        } else if ((char === "<" || char === ">" || char === "=" || char === "!") && nextChar === "=") {
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
        while (this.pos < this.code.length && /[a-zA-Z0-9_$-]/.test(this.code[this.pos])) {
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

      // Ignore unknown chars
      this.pos++;
    }
    return tokens;
  }
}

class Parser {
  constructor(tokens, language = "javascript") {
    this.tokens = tokens;
    this.language = language;
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
      const valUpper = token.value.toUpperCase();
      
      // COBOL statements
      if (valUpper === "DISPLAY") {
        this.next(); // skip 'DISPLAY'
        const arg = this.parseExpression();
        if (this.peek()?.value === ".") this.next(); // skip optional dot
        return { type: "CallExpression", callee: "DISPLAY", arguments: [arg] };
      }
      
      if (valUpper === "EVALUATE") {
        this.next(); // skip 'EVALUATE'
        const expr = this.parseExpression();
        const body = [];
        while (this.peek() && this.peek().value.toUpperCase() !== "END-EVALUATE") {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
        if (this.peek()?.value.toUpperCase() === "END-EVALUATE") this.next();
        if (this.peek()?.value === ".") this.next();
        return { type: "BlockStatement", body };
      }
      
      if (valUpper === "WHEN") {
        this.next(); // skip 'WHEN'
        this.parseExpression(); // skip condition
        return null;
      }
      
      if (valUpper === "PERFORM") {
        this.next(); // skip 'PERFORM'
        if (this.peek()?.value.toUpperCase() === "UNTIL") this.next();
        const test = this.parseExpression();
        const body = [];
        while (this.peek() && this.peek().value.toUpperCase() !== "END-PERFORM") {
          const stmt = this.parseStatement();
          if (stmt) body.push(stmt);
        }
        if (this.peek()?.value.toUpperCase() === "END-PERFORM") this.next();
        if (this.peek()?.value === ".") this.next();
        return { type: "WhileStatement", test, body };
      }

      if (["IDENTIFICATION", "PROGRAM-ID", "PROCEDURE", "DIVISION", "STOP", "RUN"].includes(valUpper)) {
        this.next();
        if (this.peek()?.value === ".") this.next();
        return null;
      }

      // SQL SELECT statement
      if (valUpper === "SELECT") {
        this.next(); // skip 'SELECT'
        while (this.peek() && this.peek().value.toUpperCase() !== "FROM") {
          this.next();
        }
        if (this.peek()?.value.toUpperCase() === "FROM") this.next();
        const tableExpr = this.parseExpression();
        return { type: "CallExpression", callee: "SELECT", arguments: [tableExpr] };
      }
    }

    // HTML tags start with '<' symbol
    if (token.value === "<") {
      this.next(); // skip '<'
      const isClosing = this.peek()?.value === "/";
      if (isClosing) this.next(); // skip '/'
      const nameToken = this.next();
      while (this.peek() && this.peek().value !== ">") {
        this.next();
      }
      if (this.peek()?.value === ">") this.next();
      if (nameToken && nameToken.type === "Identifier") {
        return { type: isClosing ? "EndElement" : "ElementDeclaration", id: nameToken.value };
      }
      return null;
    }

    if (token.type === "Keyword") {
      switch (token.value) {
        case "echo":
          this.next(); // skip 'echo'
          const arg = this.parseExpression();
          // skip dot/concatenation values like . PHP_EOL or . "\n"
          while (this.peek() && (this.peek().value === "." || this.peek().value === "PHP_EOL" || this.peek().type === "String" || this.peek().type === "Identifier")) {
            this.next();
          }
          if (this.peek()?.value === ";") this.next();
          return { type: "CallExpression", callee: "echo", arguments: [arg] };

        // Javascript variables
        case "const":
        case "let":
        case "var":
          return this.parseVariableDeclaration();

        // Python function
        case "def":
          return this.parseFunctionDeclarationPythonOrRuby();

        // Go function
        case "func":
          return this.parseFunctionDeclarationGo();

        // Java/C++ variable types & functions modifiers
        case "int":
        case "double":
        case "float":
        case "char":
        case "String":
        case "void":
        case "string":
        case "public":
        case "private":
          return this.parseJavaOrCppDeclaration();

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

    // Implicit variable assignments like name = val or name := val in Python/Go/Ruby
    if (token.type === "Identifier") {
      const nextToken = this.tokens[this.idx + 1];
      if (nextToken && (nextToken.value === "=" || nextToken.value === ":=")) {
        return this.parseImplicitVariableAssignment();
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

  parseImplicitVariableAssignment() {
    const nameToken = this.next();
    this.next(); // skip '=' or ':='
    const init = this.parseExpression();
    if (this.peek()?.value === ";") this.next();
    return {
      type: "VariableDeclaration",
      kind: "assignment",
      id: nameToken.value,
      init
    };
  }

  parseJavaOrCppDeclaration() {
    // Skip public/private/static etc.
    while (this.peek() && ["public", "private", "static", "protected"].includes(this.peek().value)) {
      this.next();
    }
    // Now we must be at a type: int, void, String, etc.
    const typeToken = this.next();
    if (!typeToken) return null;
    const nameToken = this.next();
    if (!nameToken || nameToken.type !== "Identifier") return null;

    if (this.peek()?.value === "(") {
      // Function declaration
      this.next(); // skip '('
      const params = [];
      while (this.peek() && this.peek().value !== ")") {
        // Skip param type, grab name
        this.next();
        const paramName = this.next();
        if (paramName && paramName.type === "Identifier") {
          params.push(paramName.value);
        }
        if (this.peek()?.value === ",") this.next();
      }
      if (this.peek()?.value === ")") this.next();

      // Skip return type markers or throws until '{'
      while (this.peek() && this.peek().value !== "{") this.next();

      const body = this.parseBlockStatement();
      return {
        type: "FunctionDeclaration",
        id: nameToken.value,
        params,
        body
      };
    } else {
      // Variable declaration
      let init = null;
      if (this.peek()?.value === "=") {
        this.next(); // skip '='
        init = this.parseExpression();
      }
      if (this.peek()?.value === ";") this.next();
      return {
        type: "VariableDeclaration",
        kind: typeToken.value,
        id: nameToken.value,
        init
      };
    }
  }

  parseForStatement() {
    this.next(); // skip 'for'
    if (this.peek()?.value === "(") this.next(); // skip '('

    let init = null;
    if (this.peek()?.type === "Identifier" || (this.peek()?.type === "Keyword" && ["let", "const", "var", "int"].includes(this.peek()?.value))) {
      init = this.parseStatement();
    }

    // Skip past conditions to loop boundary
    while (this.peek() && !["{", ":", "do"].includes(this.peek().value)) {
      this.next();
    }

    if (this.peek() && ["{", ":", "do"].includes(this.peek().value)) {
      if (this.peek().value !== "{") this.next();
    }

    let body = null;
    if (this.language === "python" || this.language === "ruby") {
      body = this.parseBlockStatementPythonOrRuby();
    } else {
      body = this.parseBlockStatement();
    }

    return {
      type: "ForStatement",
      init,
      body
    };
  }

  parseWhileStatement() {
    this.next(); // skip 'while'
    if (this.peek()?.value === "(") this.next();
    const test = this.parseExpression();
    
    while (this.peek() && !["{", ":", "do"].includes(this.peek().value)) {
      this.next();
    }
    if (this.peek() && ["{", ":", "do"].includes(this.peek().value)) {
      if (this.peek().value !== "{") this.next();
    }

    let body = null;
    if (this.language === "python" || this.language === "ruby") {
      body = this.parseBlockStatementPythonOrRuby();
    } else {
      body = this.parseBlockStatement();
    }

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

  parseFunctionDeclarationPythonOrRuby() {
    this.next(); // skip 'def'
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

    if (this.peek()?.value === ":") this.next(); // skip python colon

    const body = this.parseBlockStatementPythonOrRuby();
    return {
      type: "FunctionDeclaration",
      id: nameToken.value,
      params,
      body
    };
  }

  parseFunctionDeclarationGo() {
    this.next(); // skip 'func'
    let token = this.peek();
    if (token?.value === "(") {
      this.next();
      while (this.peek() && this.peek().value !== ")") this.next();
      if (this.peek()?.value === ")") this.next();
    }
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

    while (this.peek() && this.peek().value !== "{") this.next();

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

  parseBlockStatementPythonOrRuby() {
    const body = [];
    while (this.peek()) {
      const token = this.peek();
      if (token.type === "Keyword" && (token.value === "def" || token.value === "end")) {
        if (token.value === "end") this.next(); // skip 'end'
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }
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

    if (token.type === "Identifier") {
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

export function parseCodeToAST(code, language = "javascript") {
  const tokenizer = new Tokenizer(code, language);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens, language);
  return parser.parse();
}

export function validateAST(ast, requiredNodes = []) {
  if (!ast || !ast.body) return false;

  const foundSet = new Set();
  const traverse = (node) => {
    if (!node) return;
    if (node.type) foundSet.add(node.type);

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
