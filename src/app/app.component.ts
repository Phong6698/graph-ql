import {Component, OnInit} from '@angular/core';
import {Apollo, gql} from 'apollo-angular';
import {map, tap} from 'rxjs/operators';
import {FormControl, Validators} from '@angular/forms';

@Component({
  selector: 'gql-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'graph-ql';

  people: any[] | undefined;
  tasks: any[] | undefined;
  selectedPerson: any;
  editPerson: any;
  editTask: any;
  newTask = new FormControl('', Validators.required);
  newPerson = new FormControl('', Validators.required);
  editPersonName = new FormControl('', Validators.required);
  editTaskName = new FormControl('', Validators.required);

  constructor(private apollo: Apollo) {
  }

  ngOnInit(): void {
    this.loadPeople();
  }

  private loadPeople = (): void => {
    this.apollo.query<any>({
      query: gql`
        {
          people(order: updatedAt_DESC) {
            edges {
              node {
                id,
                name
              }
            }
          }
        }
      `,
    }).pipe(
      map(res => res.data.people.edges.map((edge: any) => ({id: edge.node.id, name: edge.node.name})))
    ).subscribe(people => this.people = people);
  }

  loadTask = (): void => {
    this.apollo.query<any>({
      query: gql`
        query getTasks($personId: ID){
          tasks(
            where: {
              person: {
                have: {
                  id: {equalTo: $personId}
                }
              }
            },
            order: updatedAt_DESC
          ) {
            count,
            edges {
              node {
                id,
                name,
              }
            }
          }
        }
      `,
      variables: {
        personId: this.selectedPerson.id
      }
    }).pipe(
      tap(console.log),
      map(res => res.data.tasks.edges.map((edge: any) => ({id: edge.node.id, name: edge.node.name})))
    ).subscribe(tasks => this.tasks = tasks);
  }

  addNewTask(): void {
    if (this.newTask.invalid && !this.selectedPerson) {
      return;
    }
    this.apollo.mutate<any>({
      mutation: gql`
          mutation createTask($name: String!, $personId: ID!) {
            createTask(
              input: {
                fields: {
                  name: $name,
                  person: {
                    add: [$personId]
                  }
                }
              }
            ) {
              task {
                id,
              }
            }
          }
        `,
      variables: {
        name: this.newTask.value,
        personId: this.selectedPerson.id,
      }
    }).subscribe(this.loadTask);
    this.newTask.reset();
  }

  addNewPerson(): void {
    if (this.newPerson.invalid) {
      return;
    }

    this.apollo.mutate<any>({
      mutation: gql`
          mutation createPerson($name: String!) {
            createPerson(
              input: {
                fields: {
                  name: $name
                }
              }
            ) {
              person {
                id,
              }
            }
          }
        `,
      variables: {
        name: this.newPerson.value
      }
    }).subscribe(this.loadPeople);
    this.newPerson.reset();
  }

  removeTask(id: string): void {
    this.apollo.mutate({
      mutation: gql`
        mutation deleteTask($taskId: ID!) {
          deleteTask(input: { id: $taskId }) {
            task {
              id
            }
          }
        }
      `,
      variables: {
        taskId: id
      }
    }).subscribe(this.loadTask);
  }

  removePerson(id: string): void {
    this.apollo.mutate({
      mutation: gql`
        mutation deletePerson($personId: ID!) {
          deletePerson(input: { id: $personId }) {
            person {
              id
            }
          }
        }
      `,
      variables: {
        personId: id
      }
    }).subscribe(this.loadPeople);
  }

  onEditPerson(person: any): void {
    this.editPerson = person;
    this.editPersonName.setValue(person.name);
    console.log(this.editPersonName.value);
  }

  onEditTask(task: any): void {
    this.editTask = task;
    this.editTaskName.setValue(task.name);
  }

  saveEditPerson(): void {
    if (this.editPersonName.invalid) {
      return;
    }

    this.apollo.mutate({
      mutation: gql`
        mutation updatePerson($name: String!, $id: ID!) {
          updatePerson(
            input: {
              id: $id,
              fields: {name: $name}
            }
          ) {
            person {
              id
            }
          }
        }
      `,
      variables: {
        name: this.editPersonName.value,
        id: this.editPerson.id
      }
    }).subscribe(this.loadPeople);
    this.resetEditPerson();
  }

  saveEditTask(): void {
    if (this.editTaskName.invalid) {
      return;
    }
    this.apollo.mutate({
      mutation: gql`
        mutation updateTask($name: String!, $id: ID!) {
          updateTask(
            input: {
              id: $id,
              fields: {name: $name}
            }
          ) {
            task {
              id
            }
          }
        }
      `,
      variables: {
        name: this.editTaskName.value,
        id: this.editTask.id
      }
    }).subscribe(this.loadTask);
    this.resetEditTask();
  }

  resetEditPerson(): void {
    this.editPerson = undefined;
    this.editPersonName.reset();
  }

  resetEditTask(): void {
    this.editTask = undefined;
    this.editTaskName.reset();
  }

  trackById = (item: any) => item.id;

}
