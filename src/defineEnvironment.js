// @flow
import {groupTypes as htmlGroupTypes} from "./buildHTML";
import {groupTypes as mathmlGroupTypes} from "./buildMathML";

import Options from "./Options";
import ParseNode from "./ParseNode";

import type Parser from "./Parser";
import type {ArgType, Mode} from "./types";

/**
 * The context contains the following properties:
 *  - mode: current parsing mode.
 *  - envName: the name of the environment, one of the listed names.
 *  - parser: the parser object.
 */
type EnvContext = {|
    mode: Mode,
    envName: string,
    parser: Parser,
|};

/**
 * The handler function receives two arguments
 *  - context: information and references provided by the parser
 *  - args: an array of arguments passed to \begin{name}
 */
type EnvHandler = (context: EnvContext, args: ParseNode[]) => ParseNode;

/**
 *  - numArgs: (default 0) The number of arguments after the \begin{name} function.
 *  - argTypes: (optional) Just like for a function
 *  - allowedInText: (default false) Whether or not the environment is allowed
 *                   inside text mode (not enforced yet).
 *  - numOptionalArgs: (default 0) Just like for a function
 */
type EnvProps = {
    numArgs?: number,
    argTypes?: ArgType[],
    allowedInText?: boolean,
    numOptionalArgs?: number,
};

/**
 * Final enviornment spec for use at parse time.
 * This is almost identical to `EnvDefSpec`, except it
 * 1. includes the function handler
 * 2. requires all arguments except argType
 * It is generated by `defineEnvironment()` below.
 */
type EnvSpec = {|
    numArgs: number,
    argTypes?: ArgType[],
    greediness: number,
    allowedInText: boolean,
    numOptionalArgs: number,
    handler: EnvHandler,
|};

/**
 * All registered environments.
 * `environments.js` exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary via `environments.js`.
 */
export const _environments: {[string]: EnvSpec} = {};

type EnvDefSpec = {|
    // Unique string to differentiate parse nodes.
    type: string,

    // List of functions which use the give handler, htmlBuilder,
    // and mathmlBuilder.
    names: Array<string>,

    // Properties that control how the environments are parsed.
    props: EnvProps,

    handler: EnvHandler,

    // This function returns an object representing the DOM structure to be
    // created when rendering the defined LaTeX function.
    // TODO: Port buildHTML to flow and make the group and return types explicit.
    htmlBuilder: (group: *, options: Options) => *,

    // This function returns an object representing the MathML structure to be
    // created when rendering the defined LaTeX function.
    // TODO: Port buildMathML to flow and make the group and return types explicit.
    mathmlBuilder: (group: *, options: Options) => *,
|};

export default function defineEnvironment({
    type,
    names,
    props,
    handler,
    htmlBuilder,
    mathmlBuilder,
}: EnvDefSpec) {
    // Set default values of environments
    const data = {
        numArgs: props.numArgs || 0,
        argTypes: props.argTypes,
        greediness: 1,
        allowedInText: !!props.allowedInText,
        numOptionalArgs: props.numOptionalArgs || 0,
        handler: handler,
    };
    for (let i = 0; i < names.length; ++i) {
        _environments[names[i]] = data;
    }
    if (htmlBuilder) {
        htmlGroupTypes[type] = htmlBuilder;
    }
    if (mathmlBuilder) {
        mathmlGroupTypes[type] = mathmlBuilder;
    }
}
