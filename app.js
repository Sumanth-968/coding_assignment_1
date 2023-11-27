const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dateFormat = require("date-fns/format");
const dateIsMatch = require("date-fns/isMatch");
const dateIsValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//GET TODO

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const { search_q = " ", priority, status, category } = request.query;

  switch (true) {
    //SCENARIO - PRIORITY & STATUS
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                        SELECT
                        *
                        FROM todo
                        WHERE
                        status = '${status}' AND priority = '${priority}';
                    `;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // SCENARIO - CATEGORY & STATUS
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                        SELECT
                        *
                        FROM todo
                        WHERE status = '${status}' AND category = '${category}';
                    `;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    // SCENARIO CATEGORY & PRIORITY
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          getTodosQuery = `
                        SELECT
                        *
                        from todo
                        WHERE
                        priority = '${priority}' AND category = '${category}'; 
                    `;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //SCENARIO - PRIORITY
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                    SELECT
                    *
                    FROM todo
                    WHERE
                    priority = '${priority}';
                `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //SCENARIO - STATUS
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                    SELECT
                    *
                    FROM todo
                    WHERE
                    status = '${status}';
                `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //SCENARIO ONLY SEARCH
    case hasSearchProperty(request.query):
      getTodosQuery = `
                SELECT
                *
                FROM todo
                WHERE
                todo LIKE '%${search_q}%';
            `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
      break;
    //SCENARIO - CATEGORY
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
                    SELECT
                    *
                    FROM todo
                    WHERE
                    category = '${category}';
                `;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //SCENARIO - DEFAULT
    default:
      getTodosQuery = `
            SELECT
            *
            FROM
            todo;
            `;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
  }
});

// GET TODO BASED ON ID

app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const getToDoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
    const responseResult = await db.get(getToDoQuery);
    console.log(responseResult);
    response.send(responseResult.map((eachItem) => outputResult(eachItem)));
  } catch (e) {
    console.log(`DB ERROR : ${e.meeage}`);
    process.exit(1);
  }
});

//GET TODO BASED ON DATE

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(dateIsMatch(date, "yyyy-MM-dd"));

  if (dateIsMatch(date, "yyyy-MM-dd")) {
    const newDate = dateFormat(new Date(date), "yyyy-MM-dd");

    console.log(newDate);

    const requestQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;

    const responseResult = await db.all(requestQuery);

    response.send(responseResult.map((eachItem) => outputResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//POST

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (dateIsMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = dateFormat(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                        INSERT INTO
                        todo (id,todo,category,priority,status,due_date)
                        VALUES
                            (${id},'${todo}','${category}','${priority}','${status}','${postNewDueDate}');
                    `;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//PUT

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateColumn = "";

  const requestBody = request.body;

  console.log(requestBody);

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  let updateQuery;
  switch (true) {
    //UPDATE STATUS
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `
                UPDATE todo
                SET
                todo = '${todo}' , priority = '${priority}' , status = '${status}' , category = '${category}',
                due_date = '${dueDate}' WHERE id=${todoId};
                `;
        await db.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //UPDATE PRIORITY
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateQuery = `
                UPDATE todo
                SET 
                todo = '${todo}' , priority = '${priority}' , status = '${status}' , category = '${category}',
                due_date = '${dueDate}' WHERE id=${todoId};
                `;
        await db.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //TODO
    case requestBody.todo !== undefined:
      updateQuery = `
            UPDATE todo
            SET 
            todo = '${todo}' , priority = '${priority}' , status = '${status}' , category = '${category}',
            due_date = '${dueDate}' WHERE id=${todoId};
            `;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
    //CATEGORY
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `
                UPDATE todo
                SET 
                todo = '${todo}' , priority = '${priority}' , status = '${status}' , category = '${category}',
                due_date = '${dueDate}' WHERE id=${todoId};
                `;
        await db.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //DUE DATE
    case requestBody.dueDate !== undefined:
      if (dateIsMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = dateFormat(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `
                UPDATE todo
                SET 
                todo = '${todo}' , priority = '${priority}' , status = '${status}' , category = '${category}',
                due_date = '${newDueDate}' WHERE id=${todoId};
                `;
        await db.run(updateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// DELETE
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE 
        FROM
        todo
        WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
