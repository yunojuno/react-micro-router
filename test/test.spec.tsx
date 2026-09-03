import React from "react";
import {
    Route,
    Link,
    getCurrentPath,
    getParams,
    location,
    redirect,
    routes,
} from "../index";
import type { ComponentRouteProps } from "../index";
import { act, render, screen } from "@testing-library/react";
import userEvent from '@testing-library/user-event';

function changeURL(newPath: string) {
    location.path = () => newPath;
}

test("Basic route", () => {
    changeURL("/mocked");

    render(
        <Route path="/mocked">
            <p>Hello</p>
        </Route>
    );

    expect(screen.getAllByText("Hello")).toHaveLength(1)
    expect(getCurrentPath()).toEqual("/mocked");
    expect(getParams(null)).toEqual([]);
});

test("Route with params", () => {
    changeURL("/mocked/1");

    render(
        <div>
            <Route path="/mocked/" exact>
                <p>No</p>
            </Route>
            <Route path="/mocked/([0-9]+)">
                <p>Yes</p>
            </Route>
        </div>
    );

    expect(screen.getAllByText("Yes")).toHaveLength(1);
    expect(getCurrentPath()).toEqual("/mocked/([0-9]+)");
    expect(getParams(null)).toEqual(["1"]);
});


describe('child route prop', () => {
    const ComponentA = (props: { route: ComponentRouteProps }) =>
      <div>
          <span>{props.route.path}</span>
          <span>{props.route.params[0]}</span>
      </div>


    const ComponentB = (props: { route: ComponentRouteProps }) =>
      <div>
          {props.route.path} - B
      </div>

        changeURL(`/mocked?q="test"`);

        render(
          <div>
              <Route path="/mocked(.*)">
                  {/* route prop is overridden */}
                  <ComponentA route={{
                        path: "",
                        params: []
                    }} />
                  <ComponentB route={{
                        path: "",
                        params: []
                    }} />
              </Route>
          </div>
        )

    expect(screen.getAllByText("/mocked(.*)")).toHaveLength(1);
    expect(screen.getAllByText("?q=\"test\"")).toHaveLength(1);
    expect(screen.getAllByText("/mocked(.*) - B")).toHaveLength(1);
});

test("Route with function as a child", () => {
    changeURL("/mocked/faac");

    render(
        <div>
            <Route path="/mocked/no">
                {() => <div>Hidden</div>}
            </Route>
            <Route path="/mocked/faac">
                {(route) => <div>{route.path}</div>}
            </Route>
        </div>
    )
    
    expect(screen.queryAllByText("Hidden")).toHaveLength(0);
    expect(screen.getAllByText("/mocked/faac")).toHaveLength(1);
});


test("Nested route", () => {
        changeURL("/mocked/child");

        render(
            <div>
                <Route path="/mocked">
                    <p>Yes</p>
                    <Route path="/mocked/child">
                        <p>And Yes</p>
                    </Route>
                </Route>
            </div>
        );
    

    
        expect(screen.getAllByText("Yes")).toHaveLength(1);
        expect(screen.getAllByText("And Yes")).toHaveLength(1);
    
        expect(getCurrentPath()).toEqual("/mocked/child");
});

test("Route prop", () => {
    changeURL("/mocked/42");

    function Mocked(props: { route: ComponentRouteProps }) {
        return (
            <div>
                <p>{props.route.path}</p>
                <p>{props.route.params[0]}</p>
            </div>
        );
    }

    render(
        <Route path="/mocked/([0-9]+)">
            {/* route prop is overridden */}
            <Mocked route={{
                path: "",
                params: []
            }}  />
        </Route>
    );
    expect(screen.getAllByText("/mocked/([0-9]+)")).toHaveLength(1);
    expect(screen.getAllByText("42")).toHaveLength(1);
});

test("Link", () => {
    render(<Link to="/hello">Hello</Link>);

    expect(screen.getAllByText("Hello")).toHaveLength(1);

    expect(screen.getByText("Hello").getAttribute("href")).toEqual("/hello");
});

test("Link with activeClassnames", async () => {    
    changeURL("/shortlist/");

    render(
        <Route path="/shortlist/">
            <Link className="link1" to="/shortlist/" exact>
                Hello
            </Link>
            <Link className="link2" to="/shortlist/interested/">
                Hello interested
            </Link>
            <Link className="link3" to="/shortlist/uninterested/">
                Hello uninterested
            </Link>
        </Route>
    );

    expect(
        screen.getAllByText("Hello")[0].getAttribute("class")
    ).toContain("active");

    changeURL("/shortlist/uninterested/");
    await userEvent.click(screen.getByText("Hello uninterested"));

    expect(screen.getByText("Hello").getAttribute("class")).not.toContain("active");
    expect(screen.getByText("Hello interested").getAttribute("class")).not.toContain("active");
    expect(screen.getByText("Hello uninterested").getAttribute("class")).toContain("active");

});
    
test("changeUrl should mark /shortlist/interested/ as active", async () => {
    changeURL("/shortlist/");

    render(
        <Route path="/shortlist/">
            <Link className="link1" to="/shortlist/" exact>
                Hello
            </Link>
            <Link className="link1" to="/shortlist/interested/">
                Hello interested
            </Link>
            <Link className="link1" to="/shortlist/uninterested/">
                Hello uninterested
            </Link>
        </Route>
    );
        changeURL("/shortlist/interested/");
        await userEvent.click(screen.getByText("Hello interested"));

        expect(screen.getByText("Hello").getAttribute("class")).not.toContain("active");
        expect(screen.getByText("Hello interested").getAttribute("class")).toContain("active");
        expect(screen.getByText("Hello uninterested").getAttribute("class")).not.toContain("active");
});

test("redirect updates routes mounted in React Strict Mode", () => {
    let unmountedUpdates = 0;

    class TrackedRoute extends Route {
        isMounted = false;

        componentDidMount() {
            super.componentDidMount();
            this.isMounted = true;
        }

        componentWillUnmount() {
            this.isMounted = false;
            super.componentWillUnmount();
        }

        forceUpdate(callback?: () => void) {
            if (!this.isMounted) {
                unmountedUpdates += 1;
            }
            super.forceUpdate(callback);
        }
    }

    window.history.replaceState({}, "", "/strict-mode/start");
    location.path = () => window.location.pathname;

    render(
        <React.StrictMode>
            <TrackedRoute path="/strict-mode/start" exact>
                <p>Start route</p>
            </TrackedRoute>
            <TrackedRoute path="/strict-mode/end" exact>
                <p>End route</p>
            </TrackedRoute>
        </React.StrictMode>
    );

    expect(screen.getByText("Start route")).toBeTruthy();
    expect(screen.queryByText("End route")).toBeNull();
    expect(routes).toHaveLength(2);

    act(() => redirect("/strict-mode/end"));

    expect(window.location.pathname).toBe("/strict-mode/end");
    expect(screen.queryByText("Start route")).toBeNull();
    expect(screen.getByText("End route")).toBeTruthy();
    expect(unmountedUpdates).toBe(0);
});

test("unmount only removes a route when it is registered", () => {
    let firstRoute: Route | null = null;
    let secondRoute: Route | null = null;

    const firstRender = render(
        <React.StrictMode>
            <Route path="/first" ref={(route) => {
                if (route) {
                    firstRoute = route;
                }
            }}>
                <p>First</p>
            </Route>
        </React.StrictMode>
    );
    const secondRender = render(
        <React.StrictMode>
            <Route path="/second" ref={(route) => {
                if (route) {
                    secondRoute = route;
                }
            }}>
                <p>Second</p>
            </Route>
        </React.StrictMode>
    );

    expect(routes).toEqual([firstRoute, secondRoute]);

    routes.splice(routes.indexOf(firstRoute as Route), 1);
    firstRender.unmount();

    expect(routes).toEqual([secondRoute]);

    secondRender.unmount();
    expect(routes).toHaveLength(0);
});
